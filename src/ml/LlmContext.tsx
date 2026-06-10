// Holds the on-device LLM and shares it app-wide. Mirrors Ocr/SttContext: the LLM
// is the largest model, so it's LAZY-loaded (preventLoad until the first answer/
// preload) — a user who never asks a question never pays the (~1 GB) download.
// Screens call useLlm().answer(question, sources) to get a grounded reply.
import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useLLM } from 'react-native-executorch'

import { buildEnrichMessages, type Enrichment, parseEnrichment } from './enrich'
import { LLM_MODEL } from './llm'
import { type AnswerSource, buildAnswerMessages } from './prompt'
import { useLazyModel } from './useLazyModel'

export interface LlmApi {
  /** Answer a question grounded in the given retrieved notes. Loads the model on first call. */
  answer: (question: string, sources: readonly AnswerSource[]) => Promise<string>
  /** Summarize + tag a captured note (Phase 2B auto-enrich). Loads the model on first call. */
  enrich: (text: string) => Promise<Enrichment>
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
  const { model, modelRef, ensureLoaded, preload, isLoading } = useLazyModel(useLLM, {
    model: LLM_MODEL,
  })

  // generate() is stateless (no conversation context), exactly what RAG + enrich want.
  const answer = useCallback(
    async (question: string, sources: readonly AnswerSource[]) => {
      await ensureLoaded()
      return (await modelRef.current.generate(buildAnswerMessages(question, sources))).trim()
    },
    [ensureLoaded, modelRef],
  )

  const enrich = useCallback(
    async (text: string) => {
      await ensureLoaded()
      return parseEnrichment(await modelRef.current.generate(buildEnrichMessages(text)))
    },
    [ensureLoaded, modelRef],
  )

  const value: LlmApi = {
    answer,
    enrich,
    preload,
    isReady: model.isReady,
    isLoading,
    isGenerating: model.isGenerating,
    downloadProgress: model.downloadProgress,
    error: model.error,
  }
  return <LlmContext.Provider value={value}>{children}</LlmContext.Provider>
}

export function useLlm(): LlmApi {
  const ctx = useContext(LlmContext)
  if (!ctx) throw new Error('useLlm must be used within an LlmProvider')
  return ctx
}
