// Dev-only on-device model smoke test (addresses code-review finding C2). One screen
// to confirm the executorch models actually RUN on a physical device — embeddings, the
// LLM, and OCR run real inference here; STT shows a model-load check (full transcription
// is exercised from the Capture screen, which records the waveform). The models crash
// with SIGILL on the Apple-Silicon emulator, so this is meant to be tapped on a phone.
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { Text, View } from 'react-native'

import { Header } from '@/components/Header'
import { Screen } from '@/components/Screen'
import { Button, Card } from '@/components/ui'
import { useEmbeddings } from '@/ml/EmbeddingsContext'
import { useLlm } from '@/ml/LlmContext'
import { useOcr } from '@/ml/OcrContext'
import { useStt } from '@/ml/SttContext'

type Status = 'idle' | 'running' | 'pass' | 'fail'
interface Result {
  status: Status
  detail?: string
  ms?: number
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))
const ICON: Record<Status, string> = { idle: '⚪', running: '⏳', pass: '✅', fail: '❌' }

function CheckCard({
  title,
  hint,
  result,
  progress,
  children,
}: {
  title: string
  hint: string
  result: Result
  progress?: number
  children: React.ReactNode
}) {
  const downloading = result.status === 'running' && progress !== undefined && progress < 1
  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
        <Text className="text-base">
          {ICON[result.status]}
          {result.ms !== undefined ? <Text className="text-xs text-slate-400"> {result.ms}ms</Text> : null}
        </Text>
      </View>
      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</Text>
      {downloading ? (
        <Text className="mt-1 text-xs text-slate-400">Downloading model… {Math.round((progress ?? 0) * 100)}%</Text>
      ) : null}
      {result.detail ? (
        <Text className="mt-1 text-xs text-slate-600 dark:text-slate-300" numberOfLines={4}>
          {result.detail}
        </Text>
      ) : null}
      <View className="mt-3">{children}</View>
    </Card>
  )
}

export default function SmokeScreen() {
  // Hooks must run unconditionally (rules of hooks) — the __DEV__ gate only changes render.
  const emb = useEmbeddings()
  const llm = useLlm()
  const ocr = useOcr()
  const stt = useStt()
  const [embRes, setEmbRes] = useState<Result>({ status: 'idle' })
  const [llmRes, setLlmRes] = useState<Result>({ status: 'idle' })
  const [ocrRes, setOcrRes] = useState<Result>({ status: 'idle' })

  // Embeddings + LLM need only text, so they're a true one-tap check.
  const runTextChecks = async () => {
    setEmbRes({ status: 'running' })
    try {
      const t0 = Date.now()
      const v = await emb.embed('on-device smoke test')
      setEmbRes({
        status: v.length === 384 ? 'pass' : 'fail',
        detail: `${v.length} dims (expected 384)`,
        ms: Date.now() - t0,
      })
    } catch (e) {
      setEmbRes({ status: 'fail', detail: errMsg(e) })
    }

    setLlmRes({ status: 'running' })
    try {
      const t0 = Date.now()
      const out = (await llm.answer('Reply with the single word: OK.', [])).trim()
      setLlmRes({ status: out ? 'pass' : 'fail', detail: out || '(empty response)', ms: Date.now() - t0 })
    } catch (e) {
      setLlmRes({ status: 'fail', detail: errMsg(e) })
    }
  }

  // OCR needs an image — pick one and run real recognition on it.
  const runOcr = async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 })
      if (picked.canceled) return
      setOcrRes({ status: 'running' })
      const t0 = Date.now()
      const text = await ocr.extractText(picked.assets[0].uri)
      setOcrRes({
        status: 'pass',
        detail: text.trim().slice(0, 200) || '(ran; no text detected in image)',
        ms: Date.now() - t0,
      })
    } catch (e) {
      setOcrRes({ status: 'fail', detail: errMsg(e) })
    }
  }

  // STT inference needs a recorded waveform (done on the Capture screen). Here we only
  // verify the model loads, derived reactively from the context.
  const sttResult: Result = stt.error
    ? { status: 'fail', detail: errMsg(stt.error) }
    : stt.isReady
      ? { status: 'pass', detail: 'Model loaded — record a voice note on Capture to test transcription.' }
      : stt.isLoading
        ? { status: 'running' }
        : { status: 'idle', detail: 'Tap to download + load the Whisper model.' }

  if (!__DEV__) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Header title="Model smoke test" />
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-slate-500 dark:text-slate-400">
            This diagnostic is available in development builds only.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Model smoke test" />
      <Screen scroll topInset={false}>
        <Text className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Verifies the on-device models actually run on this device. Models crash on the emulator — run this on a
          physical phone. First runs download the models (embeddings ~90 MB, LLM ~1 GB).
        </Text>

        <CheckCard
          title="Embeddings"
          hint="all-MiniLM-L6-v2 — embeds text to a 384-dim vector"
          result={embRes}
          progress={emb.downloadProgress}
        >
          <Button label="Run text checks (embeddings + LLM)" onPress={() => void runTextChecks()} />
        </CheckCard>

        <CheckCard title="LLM" hint="Llama 3.2 1B — generates a grounded answer" result={llmRes} progress={llm.downloadProgress}>
          <Text className="text-xs text-slate-400 dark:text-slate-500">Runs with the button above.</Text>
        </CheckCard>

        <CheckCard title="OCR" hint="OCR_ENGLISH — reads text from an image" result={ocrRes} progress={ocr.downloadProgress}>
          <Button label="Pick image → run OCR" variant="secondary" onPress={() => void runOcr()} />
        </CheckCard>

        <CheckCard
          title="Speech-to-text"
          hint="Whisper tiny (EN) — model-load check only"
          result={sttResult}
          progress={stt.downloadProgress}
        >
          <Button
            label="Load STT model"
            variant="secondary"
            loading={stt.isLoading}
            disabled={stt.isReady || stt.isLoading}
            onPress={() => stt.preload()}
          />
        </CheckCard>
      </Screen>
    </View>
  )
}
