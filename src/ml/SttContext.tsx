// Holds the on-device speech-to-text model and shares it app-wide. Mirrors
// OcrContext: the Whisper model is large, so it's LAZY-loaded (preventLoad until
// the first transcribe/preload) — a user who never records never pays the download.
// Screens record the mic (expo-audio useAudioStream) and call useStt().transcribe(waveform).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSpeechToText } from 'react-native-executorch'

import { STT_MODEL } from './stt'

export interface SttApi {
  /** Transcribe a 16 kHz mono Float32 waveform to text. Loads the model on first call. */
  transcribe: (waveform: Float32Array) => Promise<string>
  /** Optional warm-up: start downloading/loading the model before it's needed. */
  preload: () => void
  /** True once the model is downloaded + loaded and transcribe() can run. */
  isReady: boolean
  /** True while a load has been requested but hasn't finished (drive a spinner). */
  isLoading: boolean
  /** Model download progress, 0..1 (first use only). */
  downloadProgress: number
  /** Non-null if the model failed to load or transcribe. */
  error: unknown
}

const SttContext = createContext<SttApi | null>(null)

export function SttProvider({ children }: { children: ReactNode }) {
  // Don't download until voice capture is actually used.
  const [enabled, setEnabled] = useState(false)
  const stt = useSpeechToText({ model: STT_MODEL, preventLoad: !enabled })

  // Latest instance in a ref so the async transcribe reads current load state
  // (updated in an effect, not during render; read only after an await).
  const sttRef = useRef(stt)
  useEffect(() => {
    sttRef.current = stt
  })

  // Callers waiting for the model to finish its (one-time) load.
  const waitersRef = useRef<{ resolve: () => void; reject: (e: unknown) => void }[]>([])
  useEffect(() => {
    if (stt.isReady) {
      waitersRef.current.forEach((w) => w.resolve())
      waitersRef.current = []
    } else if (stt.error) {
      waitersRef.current.forEach((w) => w.reject(stt.error))
      waitersRef.current = []
    }
  }, [stt.isReady, stt.error])

  const preload = useCallback(() => setEnabled(true), [])

  const transcribe = useCallback(async (waveform: Float32Array) => {
    if (!sttRef.current.isReady) {
      setEnabled(true) // kick off the lazy load
      await new Promise<void>((resolve, reject) => {
        if (sttRef.current.error) reject(sttRef.current.error)
        else waitersRef.current.push({ resolve, reject })
      })
    }
    const result = await sttRef.current.transcribe(waveform)
    return result.text.trim()
  }, [])

  const value: SttApi = {
    transcribe,
    preload,
    isReady: stt.isReady,
    isLoading: enabled && !stt.isReady && !stt.error,
    downloadProgress: stt.downloadProgress,
    error: stt.error,
  }
  return <SttContext.Provider value={value}>{children}</SttContext.Provider>
}

export function useStt(): SttApi {
  const ctx = useContext(SttContext)
  if (!ctx) throw new Error('useStt must be used within an SttProvider')
  return ctx
}
