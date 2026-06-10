// Loads the on-device embedding model ONCE (it's a hook, so it must live in a
// component) and shares it app-wide. Screens call useEmbeddings().embed(text)
// instead of each spinning up their own model instance.
import { createContext, useContext, type ReactNode } from 'react'
import { useTextEmbeddings } from 'react-native-executorch'

import { EMBEDDING_MODEL } from './embeddings'

export interface EmbeddingsApi {
  /** Embed text into a 384-dim vector (number[] so it JSON-serializes for SQLite). */
  embed: (text: string) => Promise<number[]>
  /** True once the model has downloaded + loaded and embed() is usable. */
  isReady: boolean
  /** Model download progress, 0..1 (first launch only). */
  downloadProgress: number
  /** Non-null if the model failed to load or embed. */
  error: unknown
}

const EmbeddingsContext = createContext<EmbeddingsApi | null>(null)

export function EmbeddingsProvider({ children }: { children: ReactNode }) {
  const model = useTextEmbeddings({ model: EMBEDDING_MODEL })
  // Recreated each render (cheap): the provider only re-renders as the model's
  // load state changes, and consumers call embed() on user action.
  const value: EmbeddingsApi = {
    embed: async (text: string) => Array.from(await model.forward(text)),
    isReady: model.isReady,
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
