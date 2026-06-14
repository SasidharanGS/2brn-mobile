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
  const { tokens } = useTheme()
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
        <Text className="py-2 text-xl font-bold text-fg">Chat</Text>
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
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={streaming ? 'Stop' : 'Send'}
          onPress={streaming ? stop : send}
          disabled={!streaming && !input.trim()}
          className={`h-11 w-11 items-center justify-center rounded-full ${streaming ? 'bg-red-500' : input.trim() ? 'bg-primary' : 'bg-surface-2'}`}
        >
          <Ionicons name={streaming ? 'stop' : 'arrow-up'} size={20} color="#fff" />
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
  const { tokens } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="mr-2 rounded-full border px-3 py-1"
      style={{
        // 8-digit hex = accent at ~15% alpha for the active fill (no opacity-modifier
        // on a var() color, which Tailwind can't alpha-composite).
        borderColor: active ? tokens.colors.accent : tokens.colors.border,
        backgroundColor: active ? `${tokens.colors.accent}26` : undefined,
      }}
    >
      <Text
        style={active && color ? { color } : undefined}
        className={`text-xs font-medium capitalize ${active ? 'text-primary' : 'text-muted'}`}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function Bubble({ msg, streaming }: { msg: Msg; streaming: boolean }) {
  const { tokens } = useTheme()
  const isUser = msg.role === 'user'
  const empty = msg.content.length === 0
  return (
    <View className={`mb-3 max-w-[88%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${isUser ? 'bg-primary' : 'border border-border bg-surface'}`}
      >
        {isUser ? (
          <Text className="text-base text-white">{msg.content}</Text>
        ) : empty && streaming ? (
          <ActivityIndicator color={tokens.colors.accent} />
        ) : (
          <Markdown>{msg.content}</Markdown>
        )}
      </View>
    </View>
  )
}
