import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AnswerCard } from '@/components/memories/AnswerCard'
import { CaptureCard } from '@/components/memories/CaptureCard'
import { MemoryCard } from '@/components/memories/MemoryCard'
import { SearchBar } from '@/components/memories/SearchBar'
import { Button } from '@/components/ui'
import { deleteMemory, getAllMemories, type LocalMemory } from '@/db/local'
import { useEmbeddings } from '@/ml/EmbeddingsContext'
import { ANSWER_CONTEXT_SIZE } from '@/ml/llm'
import { useLlm } from '@/ml/LlmContext'
import { rankBySimilarity, type SearchHit } from '@/ml/search'
import { getAutoEnrich, setAutoEnrich as persistAutoEnrich } from '@/settings/prefs'
import { MUTED, PRIMARY } from '@/theme/colors'

export default function MemoriesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { embed, isReady, downloadProgress } = useEmbeddings()
  const { answer, isGenerating, downloadProgress: llmDownloadProgress } = useLlm()

  const [items, setItems] = useState<LocalMemory[]>([])
  const [autoEnrich, setAutoEnrich] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchHit[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [askAnswer, setAskAnswer] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)

  const reload = useCallback(async () => {
    setItems(await getAllMemories())
  }, [])

  useEffect(() => {
    // Load saved memories + the auto-enrich preference on mount. Guard against
    // resolving after an early unmount (the unpaired redirect can mount/unmount fast).
    let cancelled = false
    void getAllMemories().then((m) => !cancelled && setItems(m))
    void getAutoEnrich().then((v) => !cancelled && setAutoEnrich(v))
    return () => {
      cancelled = true
    }
  }, [])

  const runSearch = async () => {
    const q = query.trim()
    setAskAnswer(null)
    if (!q) {
      setResults(null)
      return
    }
    setSearching(true)
    try {
      setResults(rankBySimilarity(items, await embed(q)))
    } finally {
      setSearching(false)
    }
  }

  // Ask 2brn: write a grounded answer to the query from the top search hits, on-device.
  const runAsk = async () => {
    const q = query.trim()
    const hits = results
    if (!q || !hits || hits.length === 0) return
    setAsking(true)
    try {
      const sources = hits
        .slice(0, ANSWER_CONTEXT_SIZE)
        .map((h) => ({ text: h.memory.text, title: h.memory.title }))
      setAskAnswer(await answer(q, sources))
    } catch {
      setAskAnswer(
        "Couldn't generate an answer — the model may still be downloading. Try again in a moment.",
      )
    } finally {
      setAsking(false)
    }
  }

  const remove = async (id: number) => {
    await deleteMemory(id)
    setResults(null)
    setQuery('')
    setAskAnswer(null)
    await reload()
  }

  const shown: LocalMemory[] = results ? results.map((r) => r.memory) : items
  // Build the id→score lookup once per results change instead of an O(n) find per row.
  const scoreById = useMemo(
    () => new Map(results?.map((r) => [r.memory.id, r.score] as const)),
    [results],
  )
  const scoreFor = (id: number) => scoreById.get(id)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center justify-between px-3 pb-2"
      >
        <View className="flex-row items-center">
          {router.canGoBack() ? (
            <Pressable
              accessibilityLabel="Back"
              onPress={() => router.back()}
              className="mr-1 h-9 w-9 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color={MUTED} />
            </Pressable>
          ) : null}
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">On this phone</Text>
        </View>
        <Pressable
          accessibilityLabel="Connect a desktop"
          onPress={() => router.push('/pair')}
          className="flex-row items-center rounded-full px-3 py-1.5"
        >
          <Ionicons name="desktop-outline" size={15} color={PRIMARY} />
          <Text className="ml-1.5 text-sm font-medium text-primary">Connect</Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
      >
        {!isReady ? (
          <Text className="mb-3 text-center text-xs text-slate-400 dark:text-slate-500">
            Preparing on-device search… {Math.round(downloadProgress * 100)}%
          </Text>
        ) : null}

        <CaptureCard
          onSaved={() => {
            setQuery('')
            setResults(null)
            void reload()
          }}
          onReload={() => void reload()}
        />

        <View className="mb-4 flex-row items-center justify-between px-1">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Auto-enrich with AI
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500">
              Summarize &amp; tag new notes on-device (downloads a model)
            </Text>
          </View>
          <Switch
            value={autoEnrich}
            onValueChange={(v) => {
              setAutoEnrich(v)
              void persistAutoEnrich(v)
            }}
          />
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => void runSearch()}
          onClear={() => {
            setQuery('')
            setResults(null)
            setAskAnswer(null)
          }}
        />

        {results && results.length > 0 && !askAnswer && !asking ? (
          <Button
            label="✨ Ask 2brn about this"
            variant="secondary"
            className="mb-3"
            onPress={() => void runAsk()}
          />
        ) : null}

        <AnswerCard
          asking={asking}
          answer={askAnswer}
          isGenerating={isGenerating}
          downloadProgress={llmDownloadProgress}
        />

        {searching ? <ActivityIndicator className="my-4" /> : null}

        {shown.length === 0 ? (
          <Text className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {results
              ? 'No matches.'
              : 'Nothing saved yet. Add a note above, or share something into 2brn.'}
          </Text>
        ) : (
          shown.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              score={scoreFor(m.id)}
              onDelete={() => void remove(m.id)}
            />
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
