// Holds the on-device speech-to-text model and shares it app-wide. Mirrors
// OcrContext: the Whisper model is large, so it's LAZY-loaded (preventLoad until
// the first transcribe/preload) — a user who never records never pays the download.
// Screens record the mic (expo-audio useAudioStream) and call useStt().transcribe(waveform).
import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useSpeechToText } from 'react-native-executorch'

import { STT_MODEL } from './stt'
import { useLazyModel } from './useLazyModel'

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
  const { model, modelRef, ensureLoaded, preload, isLoading } = useLazyModel(useSpeechToText, {
    model: STT_MODEL,
  })

  const transcribe = useCallback(
    async (waveform: Float32Array) => {
      await ensureLoaded()
      const result = await modelRef.current.transcribe(waveform)
      return result.text.trim()
    },
    [ensureLoaded, modelRef],
  )

  const value: SttApi = {
    transcribe,
    preload,
    isReady: model.isReady,
    isLoading,
    downloadProgress: model.downloadProgress,
    error: model.error,
  }
  return <SttContext.Provider value={value}>{children}</SttContext.Provider>
}

export function useStt(): SttApi {
  const ctx = useContext(SttContext)
  if (!ctx) throw new Error('useStt must be used within an SttProvider')
  return ctx
}
