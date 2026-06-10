import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useShareIntentContext } from 'expo-share-intent'
import { useEffect, useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { queryKeys } from '@/api/queryKeys'
import { Button, Card } from '@/components/ui'
import { useConnection } from '@/connection/ConnectionContext'
import { insertMemory } from '@/db/local'
import { useEmbeddings } from '@/ml/EmbeddingsContext'
import { useOcr } from '@/ml/OcrContext'
import { useAutoEnrich } from '@/ml/useAutoEnrich'

export default function ShareScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const { state } = useConnection()
  const { embed, isReady } = useEmbeddings()
  const { extractText, downloadProgress } = useOcr()
  const enrichInBackground = useAutoEnrich()
  const { shareIntent, hasShareIntent, resetShareIntent } = useShareIntentContext()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrFailed, setOcrFailed] = useState(false)
  const [done, setDone] = useState(false)
  const [seededFor, setSeededFor] = useState<string | null>(null)

  // A shared image (e.g. a screenshot) arrives as a file with an image/* mime type.
  const sharedImage = hasShareIntent
    ? (shareIntent.files?.find((f) => f.mimeType?.startsWith('image/'))?.path ?? null)
    : null

  // Seed the form from an incoming share intent. This is render-phase state
  // adjustment (React's "adjusting state when an input changes" pattern), not an
  // effect — it re-seeds only when a genuinely new intent arrives.
  const intentKey = hasShareIntent ? `${shareIntent.text ?? ''}|${shareIntent.webUrl ?? ''}|${sharedImage ?? ''}` : null
  if (intentKey && intentKey !== seededFor) {
    setSeededFor(intentKey)
    setText(shareIntent.text ?? shareIntent.webUrl ?? '')
    setUrl(shareIntent.webUrl ?? '')
    setTitle(shareIntent.meta?.title ?? '')
    setImage(sharedImage)
    setOcrFailed(false)
  }

  // When an image comes in, extract its text on-device and drop it into the note
  // (only if the share didn't already include text). The result stays editable.
  useEffect(() => {
    if (!image) return
    let cancelled = false
    void (async () => {
      setOcrBusy(true)
      setOcrFailed(false)
      try {
        const extracted = await extractText(image)
        if (!cancelled && extracted.trim()) setText((prev) => (prev.trim() ? prev : extracted))
      } catch {
        if (!cancelled) setOcrFailed(true)
      } finally {
        if (!cancelled) setOcrBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [image, extractText])

  const client = state.status === 'paired' ? state.client : null

  const save = useMutation({
    mutationFn: async () => {
      const trimmed = text.trim()
      const titleVal = title.trim() || undefined
      const urlVal = url.trim() || undefined
      // 1) Save on-device first — works offline and without a paired desktop.
      const embedding = isReady ? await embed(trimmed) : null
      const id = await insertMemory({
        text: trimmed,
        title: titleVal ?? null,
        sourceUrl: urlVal ?? null,
        source: image ? 'mobile-image' : hasShareIntent ? 'mobile-share' : 'mobile',
        embedding,
      })
      // Auto-enrich in the background (best-effort, only if enabled) — never blocks the save.
      void enrichInBackground(id, trimmed)
      // 2) Best-effort sync to the desktop when paired (companion behavior).
      if (client) {
        try {
          await client.ingestNote({ text: trimmed, title: titleVal, source_url: urlVal })
        } catch {
          // Desktop offline / unreachable — the local copy is already saved.
        }
      }
    },
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
        {done ? (
          <View className="items-center py-12">
            <Ionicons name="checkmark-circle" size={56} color="#34d399" />
            <Text className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-50">Saved to your phone</Text>
            <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              {client
                ? "It's saved on-device and synced to your desktop."
                : "It's saved on-device and searchable offline."}
            </Text>
            <View className="mt-6 w-full gap-3">
              <Button label="Done" onPress={close} />
            </View>
          </View>
        ) : (
          <Card>
            {image ? (
              <View className="mb-3">
                <Image
                  source={{ uri: image }}
                  style={{ width: '100%', height: 160, borderRadius: 8 }}
                  resizeMode="cover"
                />
                {ocrBusy ? (
                  <Text className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    Reading text from image…{downloadProgress < 1 ? ` ${Math.round(downloadProgress * 100)}%` : ''}
                  </Text>
                ) : ocrFailed ? (
                  <Text className="mt-2 text-center text-xs text-amber-500">
                    Couldn&apos;t read text from this image — type your note below.
                  </Text>
                ) : null}
              </View>
            ) : null}
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
              <Text className="mb-3 text-sm text-red-500">Couldn&apos;t save. Please try again.</Text>
            ) : null}
            <Button label="Save to 2brn" loading={save.isPending} disabled={!text.trim()} onPress={() => save.mutate()} />
            {!client ? (
              <Text className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                Saved on your phone. Connect a desktop later to sync.
              </Text>
            ) : null}
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
