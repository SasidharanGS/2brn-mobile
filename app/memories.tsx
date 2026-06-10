import { Ionicons } from '@expo/vector-icons'
import { requestRecordingPermissionsAsync, useAudioStream } from 'expo-audio'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
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

import { Button, Card } from '@/components/ui'
import { deleteMemory, getAllMemories, insertMemory, type LocalMemory } from '@/db/local'
import { concatFloat32, maxAbsAmplitude, STT_SAMPLE_RATE } from '@/ml/audioWaveform'
import { useEmbeddings } from '@/ml/EmbeddingsContext'
import { useOcr } from '@/ml/OcrContext'
import { rankBySimilarity, type SearchHit } from '@/ml/search'
import { useStt } from '@/ml/SttContext'
import { prettyTime } from '@/utils/date'

export default function MemoriesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { embed, isReady, downloadProgress } = useEmbeddings()
  const { extractText } = useOcr()
  const { transcribe, downloadProgress: sttDownloadProgress } = useStt()

  const [items, setItems] = useState<LocalMemory[]>([])
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [picking, setPicking] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchHit[] | null>(null)
  const [searching, setSearching] = useState(false)

  // Mic capture: expo-audio streams float32 PCM at 16 kHz; we collect the chunks
  // (the stream is stable — only re-created if these constant options change).
  const chunksRef = useRef<Float32Array[]>([])
  const { stream } = useAudioStream({
    sampleRate: STT_SAMPLE_RATE,
    channels: 1,
    encoding: 'float32',
    onBuffer: (buf) => chunksRef.current.push(new Float32Array(buf.data.slice(0))),
  })

  const reload = useCallback(async () => {
    setItems(await getAllMemories())
  }, [])

  useEffect(() => {
    // Load saved memories on mount (set state asynchronously, after the fetch).
    void getAllMemories().then(setItems)
  }, [])

  const add = async () => {
    const text = draft.trim()
    if (!text) return
    setAdding(true)
    try {
      const embedding = isReady ? await embed(text) : null
      await insertMemory({ text, source: 'mobile', embedding })
      setDraft('')
      setQuery('')
      setResults(null)
      await reload()
    } finally {
      setAdding(false)
    }
  }

  // Pick an image (e.g. a screenshot) and OCR it into the draft for review,
  // so its text can be saved as a searchable memory — fully on-device.
  const addFromImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 })
    if (res.canceled || !res.assets[0]) return
    setPicking(true)
    try {
      const extracted = await extractText(res.assets[0].uri)
      if (extracted.trim()) setDraft((prev) => (prev.trim() ? `${prev}\n${extracted}` : extracted))
    } catch {
      // OCR failed — leave the draft as-is for manual entry.
    } finally {
      setPicking(false)
    }
  }

  // Record a voice note, transcribe it on-device, and drop the text into the draft
  // for review — fully offline. Tap once to start, again to stop + transcribe.
  const toggleRecord = async () => {
    if (recording) {
      stream.stop()
      setRecording(false)
      const waveform = concatFloat32(chunksRef.current)
      chunksRef.current = []
      if (maxAbsAmplitude(waveform) < 0.01) return // nothing audible captured
      setTranscribing(true)
      try {
        const text = await transcribe(waveform)
        if (text) setDraft((prev) => (prev.trim() ? `${prev}\n${text}` : text))
      } catch {
        // Transcription failed — leave the draft as-is for manual entry.
      } finally {
        setTranscribing(false)
      }
      return
    }
    const perm = await requestRecordingPermissionsAsync()
    if (!perm.granted) return
    chunksRef.current = []
    await stream.start()
    setRecording(true)
  }

  const runSearch = async () => {
    const q = query.trim()
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

  const remove = async (id: number) => {
    await deleteMemory(id)
    setResults(null)
    setQuery('')
    await reload()
  }

  const shown: LocalMemory[] = results ? results.map((r) => r.memory) : items
  const scoreFor = (id: number) => results?.find((r) => r.memory.id === id)?.score

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-2 pb-2">
        <Pressable
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/pair'))}
          className="h-9 w-9 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#94a3b8" />
        </Pressable>
        <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">On this phone</Text>
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

        <Card className="mb-4">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Jot something to remember…"
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
            className="mb-3 min-h-[64px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
          <Button label="Add to memory" loading={adding} disabled={!draft.trim()} onPress={() => void add()} />
          <View className="mt-2 flex-row gap-2">
            <Button
              label="From image"
              variant="secondary"
              className="flex-1"
              loading={picking}
              disabled={recording || transcribing}
              onPress={() => void addFromImage()}
            />
            <Button
              label={recording ? 'Stop' : 'Record'}
              variant={recording ? 'danger' : 'secondary'}
              className="flex-1"
              loading={transcribing}
              disabled={picking}
              onPress={() => void toggleRecord()}
            />
          </View>
          {recording ? (
            <Text className="mt-2 text-center text-xs text-red-500">● Recording… tap Stop when done</Text>
          ) : transcribing ? (
            <Text className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              Transcribing on-device…{sttDownloadProgress < 1 ? ` ${Math.round(sttDownloadProgress * 100)}%` : ''}
            </Text>
          ) : null}
        </Card>

        <View className="mb-3 flex-row items-center rounded-xl border border-slate-300 px-3 dark:border-slate-700">
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void runSearch()}
            returnKeyType="search"
            placeholder="Search by meaning…"
            placeholderTextColor="#94a3b8"
            className="ml-2 flex-1 py-2 text-slate-900 dark:text-slate-100"
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear search"
              onPress={() => {
                setQuery('')
                setResults(null)
              }}
            >
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>

        {searching ? <ActivityIndicator className="my-4" /> : null}

        {shown.length === 0 ? (
          <Text className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {results ? 'No matches.' : 'Nothing saved yet. Add a note above, or share something into 2brn.'}
          </Text>
        ) : (
          shown.map((m) => {
            const score = scoreFor(m.id)
            return (
              <Card key={m.id} className="mb-2">
                {m.title ? (
                  <Text className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">{m.title}</Text>
                ) : null}
                <Text numberOfLines={4} className="text-sm text-slate-700 dark:text-slate-300">
                  {m.text}
                </Text>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-[11px] text-slate-400 dark:text-slate-500">
                    {prettyTime(m.createdAt)}
                    {score !== undefined ? ` · ${Math.round(score * 100)}% match` : ''}
                    {m.embedding ? '' : ' · not indexed'}
                  </Text>
                  <Pressable
                    accessibilityLabel="Delete"
                    onPress={() => void remove(m.id)}
                    className="h-8 w-8 items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={18} color="#f87171" />
                  </Pressable>
                </View>
              </Card>
            )
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
