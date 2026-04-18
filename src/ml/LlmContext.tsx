// Holds the on-device LLM and shares it app-wide. Mirrors Ocr/SttContext: the LLM
// is the largest model, so it's LAZY-loaded (preventLoad until the first answer/
// preload) — a user who never asks a question never pays the (~1 GB) download.
// Screens call useLlm().answer(question, sources) to get a grounded reply.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLLM } from 'react-native-executorch'

import { LLM_MODEL } from './llm'
import { type AnswerSource, buildAnswerMessages } from './prompt'

export interface LlmApi {
  /** Answer a question grounded in the given retrieved notes. Loads the model on first call. */
  answer: (question: string, sources: readonly AnswerSource[]) => Promise<string>
  /** Optional warm-up: start downloading/loading the model before it's needed. */
  preload: () => void
  /** True once the model is downloaded + loaded and answer() can run. */
  isReady: boolean
  /** True while a load has been requested but hasn't finished. */
  isLoading: boolean
  /** True while the model is actively generating a response. */
  isGenerating: boolean
  /** Model download progress, 0..1 (first use only). */
  downloadProgress: number
  /** Non-null if the model failed to load or generate. */
  error: unknown
}

const LlmContext = createContext<LlmApi | null>(null)

export function LlmProvider({ children }: { children: ReactNode }) {
  // Don't download until the user actually asks something.
  const [enabled, setEnabled] = useState(false)
  const llm = useLLM({ model: LLM_MODEL, preventLoad: !enabled })

  // Latest instance in a ref so the async answer() reads current load state
  // (updated in an effect, not during render; read only after an await).
  const llmRef = useRef(llm)
  useEffect(() => {
    llmRef.current = llm
  })

  // Callers waiting for the model to finish its (one-time) load.
  const waitersRef = useRef<{ resolve: () => void; reject: (e: unknown) => void }[]>([])
  useEffect(() => {
    if (llm.isReady) {
      waitersRef.current.forEach((w) => w.resolve())
      waitersRef.current = []
    } else if (llm.error) {
      waitersRef.current.forEach((w) => w.reject(llm.error))
      waitersRef.current = []
    }
  }, [llm.isReady, llm.error])

  const preload = useCallback(() => setEnabled(true), [])

  const answer = useCallback(async (question: string, sources: readonly AnswerSource[]) => {
    if (!llmRef.current.isReady) {
      setEnabled(true) // kick off the lazy load
      await new Promise<void>((resolve, reject) => {
        if (llmRef.current.error) reject(llmRef.current.error)
        else waitersRef.current.push({ resolve, reject })
      })
    }
    // generate() is stateless (no conversation context), exactly what RAG wants.
    const text = await llmRef.current.generate(buildAnswerMessages(question, sources))
    return text.trim()
  }, [])

  const value: LlmApi = {
    answer,
    preload,
    isReady: llm.isReady,
    isLoading: enabled && !llm.isReady && !llm.error,
    isGenerating: llm.isGenerating,
    downloadProgress: llm.downloadProgress,
    error: llm.error,
  }
  return <LlmContext.Provider value={value}>{children}</LlmContext.Provider>
}

export function useLlm(): LlmApi {
  const ctx = useContext(LlmContext)
  if (!ctx) throw new Error('useLlm must be used within an LlmProvider')
  return ctx
}
