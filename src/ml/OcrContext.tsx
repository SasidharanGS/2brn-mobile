// Holds the on-device OCR model and shares it app-wide (mirrors EmbeddingsContext).
// Difference: the OCR models are large, so we LAZY-load them — `preventLoad` stays
// true until something calls preload()/extractText(), so a user who never captures
// an image never pays the download. Screens call useOcr().extractText(uri).
import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useOCR } from 'react-native-executorch'

import { OCR_MODEL } from './ocr'
import { joinOcrText } from './ocrText'
import { useLazyModel } from './useLazyModel'

export interface OcrApi {
  /** Extract reading-order text from an image (file URI / path). Loads the model on first call. */
  extractText: (imageUri: string) => Promise<string>
  /** Optional warm-up: start downloading/loading the model before it's needed. */
  preload: () => void
  /** True once the OCR model is downloaded + loaded and extractText() can run. */
  isReady: boolean
  /** True while a load has been requested but hasn't finished (drive a spinner). */
  isLoading: boolean
  /** Model download progress, 0..1 (first use only). */
  downloadProgress: number
  /** Non-null if the model failed to load or recognize. */
  error: unknown
}

const OcrContext = createContext<OcrApi | null>(null)

export function OcrProvider({ children }: { children: ReactNode }) {
  const { model, modelRef, ensureLoaded, preload, isLoading } = useLazyModel(useOCR, {
    model: OCR_MODEL,
  })

  const extractText = useCallback(
    async (imageUri: string) => {
      await ensureLoaded()
      // forward() throws on its own per-image errors; let the caller handle those.
      return joinOcrText(await modelRef.current.forward(imageUri))
    },
    [ensureLoaded, modelRef],
  )

  const value: OcrApi = {
    extractText,
    preload,
    isReady: model.isReady,
    isLoading,
    downloadProgress: model.downloadProgress,
    error: model.error,
  }
  return <OcrContext.Provider value={value}>{children}</OcrContext.Provider>
}

export function useOcr(): OcrApi {
  const ctx = useContext(OcrContext)
  if (!ctx) throw new Error('useOcr must be used within an OcrProvider')
  return ctx
}
