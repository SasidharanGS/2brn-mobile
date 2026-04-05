// Holds the on-device OCR model and shares it app-wide (mirrors EmbeddingsContext).
// Difference: the OCR models are large, so we LAZY-load them — `preventLoad` stays
// true until something calls preload()/extractText(), so a user who never captures
// an image never pays the download. Screens call useOcr().extractText(uri).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useOCR } from 'react-native-executorch'

import { OCR_MODEL } from './ocr'
import { joinOcrText } from './ocrText'

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
  // Don't download until image capture is actually used.
  const [enabled, setEnabled] = useState(false)
  const ocr = useOCR({ model: OCR_MODEL, preventLoad: !enabled })

  // Latest instance in a ref so the async extractText reads current load state.
  // Updated in an effect (not during render); extractText only reads it after an
  // await, by which point effects have flushed, so it's always current.
  const ocrRef = useRef(ocr)
  useEffect(() => {
    ocrRef.current = ocr
  })

  // Callers waiting for the model to finish its (one-time) load.
  const waitersRef = useRef<{ resolve: () => void; reject: (e: unknown) => void }[]>([])
  useEffect(() => {
    if (ocr.isReady) {
      waitersRef.current.forEach((w) => w.resolve())
      waitersRef.current = []
    } else if (ocr.error) {
      waitersRef.current.forEach((w) => w.reject(ocr.error))
      waitersRef.current = []
    }
  }, [ocr.isReady, ocr.error])

  const preload = useCallback(() => setEnabled(true), [])

  const extractText = useCallback(async (imageUri: string) => {
    if (!ocrRef.current.isReady) {
      setEnabled(true) // kick off the lazy load
      await new Promise<void>((resolve, reject) => {
        if (ocrRef.current.error) reject(ocrRef.current.error)
        else waitersRef.current.push({ resolve, reject })
      })
    }
    // forward() throws on its own per-image errors; let the caller handle those.
    return joinOcrText(await ocrRef.current.forward(imageUri))
  }, [])

  const value: OcrApi = {
    extractText,
    preload,
    isReady: ocr.isReady,
    isLoading: enabled && !ocr.isReady && !ocr.error,
    downloadProgress: ocr.downloadProgress,
    error: ocr.error,
  }
  return <OcrContext.Provider value={value}>{children}</OcrContext.Provider>
}

export function useOcr(): OcrApi {
  const ctx = useContext(OcrContext)
  if (!ctx) throw new Error('useOcr must be used within an OcrProvider')
  return ctx
}
