// Holds the on-device embedding model and shares it app-wide. LAZY-loaded (M6): the
// ~90 MB model used to download at every launch — even for someone who pairs a desktop
// and only ever reads their journal. Now it loads on first embed()/preload(), so the
// capture surfaces (which call useSaveMemory → preload) warm it up, while paired-only
// users who never touch on-device features never pay for it. embed() ensure-loads, so
// it's safe to call before the model is ready (it just awaits the one-time load).
import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useTextEmbeddings } from 'react-native-executorch'

import { EMBEDDING_MODEL } from './embeddings'
import { useLazyModel } from './useLazyModel'

export interface EmbeddingsApi {
  /** Embed text into a 384-dim vector (number[] so it JSON-serializes for SQLite). Loads on first call. */
  embed: (text: string) => Promise<number[]>
  /** Optional warm-up: start loading before the first embed (capture surfaces call this). */
  preload: () => void
  /** True once the model has downloaded + loaded and embed() is immediate. */
  isReady: boolean
  /** True while a load has been requested but hasn't finished. */
  isLoading: boolean
  /** Model download progress, 0..1 (first use only). */
  downloadProgress: number
  /** Non-null if the model failed to load or embed. */
  error: unknown
}

const EmbeddingsContext = createContext<EmbeddingsApi | null>(null)

export function EmbeddingsProvider({ children }: { children: ReactNode }) {
  const { model, modelRef, ensureLoaded, preload, isLoading } = useLazyModel(useTextEmbeddings, {
    model: EMBEDDING_MODEL,
  })

  const embed = useCallback(
    async (text: string) => {
      await ensureLoaded()
      return Array.from(await modelRef.current.forward(text))
    },
    [ensureLoaded, modelRef],
  )

  const value: EmbeddingsApi = {
    embed,
    preload,
    isReady: model.isReady,
    isLoading,
    downloadProgress: model.downloadProgress,
    error: model.error,
  }
  return <EmbeddingsContext.Provider value={value}>{children}</EmbeddingsContext.Provider>
}

export function useEmbeddings(): EmbeddingsApi {
  const ctx = useContext(EmbeddingsContext)
  if (!ctx) throw new Error('useEmbeddings must be used within an EmbeddingsProvider')
  return ctx
}
