import { requestRecordingPermissionsAsync, useAudioStream } from 'expo-audio'
import * as ImagePicker from 'expo-image-picker'
import { useRef, useState } from 'react'
import { Text, TextInput, View } from 'react-native'

import { Button, Card } from '@/components/ui'
import { concatFloat32, maxAbsAmplitude, STT_SAMPLE_RATE } from '@/ml/audioWaveform'
import { useOcr } from '@/ml/OcrContext'
import { useSaveMemory } from '@/ml/useSaveMemory'
import { useStt } from '@/ml/SttContext'
import { useTheme } from '@/theme/ThemeContext'

/**
 * Capture surface for the on-device home: a text draft plus on-device image (OCR) and
 * voice (STT) helpers, saved via useSaveMemory. Self-contained — `onSaved` fires after a
 * successful save (so the parent can clear search + reload) and `onReload` after background
 * enrichment updates the row.
 */
export function CaptureCard({ onSaved, onReload }: { onSaved: () => void; onReload: () => void }) {
  const { extractText } = useOcr()
  const { transcribe, downloadProgress: sttDownloadProgress } = useStt()
  const saveMemory = useSaveMemory()
  const { tokens } = useTheme()

  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [picking, setPicking] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  // Mic capture: expo-audio streams float32 PCM at 16 kHz; we collect the chunks
  // (the stream is stable — only re-created if these constant options change).
  const chunksRef = useRef<Float32Array[]>([])
  const { stream } = useAudioStream({
    sampleRate: STT_SAMPLE_RATE,
    channels: 1,
    encoding: 'float32',
    onBuffer: (buf) => chunksRef.current.push(new Float32Array(buf.data.slice(0))),
  })

  const add = async () => {
    const text = draft.trim()
    if (!text) return
    setAdding(true)
    try {
      // Embed + persist + best-effort enrich (shared with share.tsx); refresh when enriched.
      await saveMemory({ text, source: 'mobile' }, onReload)
      setDraft('')
      onSaved()
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

  return (
    <Card className="mb-4">
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Jot something to remember…"
        placeholderTextColor={tokens.colors.muted}
        multiline
        textAlignVertical="top"
        className="mb-3 min-h-[64px] rounded-lg border border-border px-3 py-2 text-fg"
      />
      <Button
        label="Add to memory"
        loading={adding}
        disabled={!draft.trim()}
        onPress={() => void add()}
      />
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
        <Text className="mt-2 text-center text-xs text-red-500">
          ● Recording… tap Stop when done
        </Text>
      ) : transcribing ? (
        <Text className="mt-2 text-center text-xs text-muted">
          Transcribing on-device…
          {sttDownloadProgress < 1 ? ` ${Math.round(sttDownloadProgress * 100)}%` : ''}
        </Text>
      ) : null}
    </Card>
  )
}
