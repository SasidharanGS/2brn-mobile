import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ApiError } from '@/api/client'
import { TASK_CATEGORIES } from '@/api/types'
import { Markdown } from '@/components/Markdown'
import { useApi } from '@/connection/ConnectionContext'
import { useTheme } from '@/theme/ThemeContext'
import { categoryChip } from '@/theme/colors'
import { todayISODate } from '@/utils/date'

interface Msg {
  id: string
  role: 'user' | 'assistant'
  content: string
}

let idSeq = 0
const nextId = () => `m${idSeq++}`

export default function ChatScreen() {
  const api = useApi()
  const insets = useSafeAreaInsets()
  const { skin, tokens } = useTheme()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [todayOnly, setTodayOnly] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    return () => clearTimeout(t)
  }, [messages])

  const appendToLast = (chunk: string) =>
    setMessages((prev) => {
      const copy = [...prev]
      const last = copy[copy.length - 1]
      if (last && last.role === 'assistant')
        copy[copy.length - 1] = { ...last, content: last.content + chunk }
      return copy
    })

  const send = useCallback(async () => {
    const q = input.trim()
    if (!q || streaming) return
    setInput('')
    setMessages((m) => [
      ...m,
      { id: nextId(), role: 'user', content: q },
      { id: nextId(), role: 'assistant', content: '' },
    ])
    setStreaming(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      for await (const chunk of api.chatStream({
        question: q,
        dateFilter: todayOnly ? todayISODate() : undefined,
        categoryFilter: category ?? undefined,
        signal: ctrl.signal,
      })) {
        appendToLast(chunk)
      }
    } catch (e) {
      if (!ctrl.signal.aborted) {
        const msg =
          e instanceof ApiError && e.status === 0
            ? "I can't reach your desktop right now."
            : `Error: ${(e as Error).message}`
        appendToLast(`\n\n_${msg}_`)
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [api, category, input, streaming, todayOnly])

  const stop = () => abortRef.current?.abort()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom + 56}
      className="flex-1 bg-bg"
    >
      <View style={{ paddingTop: insets.top }} className="border-b border-rule px-4 pb-2">
        <Text
          className="py-2 text-xl font-bold text-fg"
          style={{
            fontFamily: tokens.fontSans,
            textTransform: tokens.lowercase ? 'lowercase' : undefined,
            fontWeight: tokens.lowercase ? '400' : undefined,
          }}
        >
          Chat
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <FilterChip
            label="Today only"
            active={todayOnly}
            onPress={() => setTodayOnly((v) => !v)}
          />
          {TASK_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              label={c}
              active={category === c}
              color={categoryChip(c).text}
              onPress={() => setCategory((cur) => (cur === c ? null : c))}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {messages.length === 0 ? (
          <View className="mt-10 items-center px-6">
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={tokens.colors.accent} />
            <Text className="mt-3 text-center text-base font-semibold text-fg">
              Ask your second brain
            </Text>
            <Text className="mt-1 text-center text-sm text-muted">
              “What did I work on this morning?” · “Summarize my research today.”
            </Text>
          </View>
        ) : (
          messages.map((m) => <Bubble key={m.id} msg={m} streaming={streaming} />)
        )}
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="flex-row items-end gap-2 border-t border-rule px-3 pt-2"
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your day…"
          placeholderTextColor={tokens.colors.muted}
          multiline
          className="max-h-28 flex-1 rounded-2xl border border-border px-4 py-2.5 text-fg"
          style={skin === 'minimal' ? { borderRadius: 0 } : undefined}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={streaming ? 'Stop' : 'Send'}
          onPress={streaming ? stop : send}
          disabled={!streaming && !input.trim()}
          className="h-11 w-11 items-center justify-center"
          style={{
            borderRadius: skin === 'minimal' ? tokens.radiusPill : 9999,
            backgroundColor: streaming
              ? '#ef4444'
              : input.trim()
                ? tokens.colors.accent
                : skin === 'minimal'
                  ? tokens.colors.rule
                  : tokens.colors.surface2,
          }}
        >
          <Ionicons
            name={streaming ? 'stop' : 'arrow-up'}
            size={20}
            color={
              streaming || input.trim() ? (skin === 'minimal' ? tokens.colors.bg : '#fff') : tokens.colors.muted
            }
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

function FilterChip({
  label,
  active,
  onPress,
  color,
}: {
  label: string
  active: boolean
  onPress: () => void
  color?: string
}) {
  const { skin, tokens } = useTheme()
  const minimal = skin === 'minimal'
  // Minimal: 3px pill, active = solid accent fill + --bg text (no category hue).
  // Modern: rounded pill, active = ~15% accent tint (8-digit hex — a var() color
  // can't take a Tailwind opacity modifier) + accent/category-colored text.
  const textColor = minimal
    ? active
      ? tokens.colors.bg
      : tokens.colors.muted
    : active
      ? (color ?? tokens.colors.accent)
      : tokens.colors.muted
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="mr-2 border px-3 py-1"
      style={{
        borderRadius: minimal ? tokens.radiusPill : 9999,
        borderColor: active ? tokens.colors.accent : tokens.colors.border,
        backgroundColor: active
          ? minimal
            ? tokens.colors.accent
            : `${tokens.colors.accent}26`
          : undefined,
      }}
    >
      <Text
        className="text-xs font-medium"
        style={{
          color: textColor,
          fontFamily: tokens.fontSans,
          textTransform: tokens.lowercase ? 'lowercase' : 'capitalize',
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function Bubble({ msg, streaming }: { msg: Msg; streaming: boolean }) {
  const { skin, tokens } = useTheme()
  const isUser = msg.role === 'user'
  const empty = msg.content.length === 0
  const minimal = skin === 'minimal'
  return (
    <View className={`mb-3 max-w-[88%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        // Minimal: square (3px) bubbles — you = --fg fill, 2brn = --ink-1 fill, no border.
        className={`px-3.5 py-2.5 ${minimal ? '' : `rounded-2xl ${isUser ? 'bg-primary' : 'border border-border bg-surface'}`}`}
        style={
          minimal
            ? { borderRadius: tokens.radiusPill, backgroundColor: isUser ? tokens.colors.fg : tokens.colors.ink[1] }
            : undefined
        }
      >
        {isUser ? (
          <Text className="text-base" style={{ color: minimal ? tokens.colors.bg : '#fff', fontFamily: tokens.fontSans }}>
            {msg.content}
          </Text>
        ) : empty && streaming ? (
          <ActivityIndicator color={tokens.colors.accent} />
        ) : (
          <Markdown>{msg.content}</Markdown>
        )}
      </View>
    </View>
  )
}
