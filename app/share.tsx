import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useShareIntentContext } from 'expo-share-intent'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { queryKeys } from '@/api/queryKeys'
import { EmptyState } from '@/components/states'
import { Button, Card } from '@/components/ui'
import { useConnection } from '@/connection/ConnectionContext'

export default function ShareScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const { state } = useConnection()
  const { shareIntent, hasShareIntent, resetShareIntent } = useShareIntentContext()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [done, setDone] = useState(false)
  const [seededFor, setSeededFor] = useState<string | null>(null)

  // Seed the form from an incoming share intent. This is render-phase state
  // adjustment (React's "adjusting state when an input changes" pattern), not an
  // effect — it re-seeds only when a genuinely new intent arrives.
  const intentKey = hasShareIntent ? `${shareIntent.text ?? ''}|${shareIntent.webUrl ?? ''}` : null
  if (intentKey && intentKey !== seededFor) {
    setSeededFor(intentKey)
    setText(shareIntent.text ?? shareIntent.webUrl ?? '')
    setUrl(shareIntent.webUrl ?? '')
    setTitle(shareIntent.meta?.title ?? '')
  }

  const client = state.status === 'paired' ? state.client : null

  const save = useMutation({
    mutationFn: () =>
      client!.ingestNote({
        text: text.trim(),
        title: title.trim() || undefined,
        source_url: url.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.sharedNotes })
      resetShareIntent()
      setDone(true)
    },
  })

  const close = () => {
    resetShareIntent()
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Save to 2brn</Text>
        <Pressable accessibilityLabel="Close" onPress={close} className="h-9 w-9 items-center justify-center">
          <Ionicons name="close" size={24} color="#94a3b8" />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
      >
        {!client ? (
          <View>
            <EmptyState
              title="Connect a device first"
              message="Pair this phone with your desktop 2brn, then you can save things into your second brain."
              icon="🔌"
            />
            <Button label="Connect" onPress={() => router.replace('/pair')} />
          </View>
        ) : done ? (
          <View className="items-center py-12">
            <Ionicons name="checkmark-circle" size={56} color="#34d399" />
            <Text className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-50">Saved to your brain</Text>
            <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              It&apos;s now searchable in chat.
            </Text>
            <View className="mt-6 w-full gap-3">
              <Button label="View saved" onPress={() => router.replace('/more/saved')} />
              <Button label="Done" variant="secondary" onPress={() => router.replace('/(tabs)')} />
            </View>
          </View>
        ) : (
          <Card>
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Title (optional)
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="A short title"
              placeholderTextColor="#94a3b8"
              className="mb-3 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Note
            </Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What do you want to remember?"
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              className="mb-3 min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Source URL (optional)
            </Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://…"
              placeholderTextColor="#94a3b8"
              className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            {save.isError ? (
              <Text className="mb-3 text-sm text-red-500">Couldn&apos;t save. Check your connection and try again.</Text>
            ) : null}
            <Button label="Save to 2brn" loading={save.isPending} disabled={!text.trim()} onPress={() => save.mutate()} />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
