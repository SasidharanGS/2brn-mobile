// Shared lazy-load lifecycle for the large on-device models — OCR, STT, and the LLM
// (M3). They shouldn't download until first use, so each passes `preventLoad: true`
// until preload()/ensureLoaded() is called. That, plus the latest-instance ref and the
// ready/error waiter bookkeeping, was duplicated ~50 lines × 3. This centralizes it; the
// model contexts become thin wrappers that just add their own forward/generate/transcribe.
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

/** The load-lifecycle fields every executorch model hook exposes. */
export interface LoadableModel {
  isReady: boolean
  error: unknown
  downloadProgress: number
}

export interface LazyModel<M extends LoadableModel> {
  /** The live model instance — reactive; read its state during render. */
  model: M
  /** The latest instance in a ref — read `.current` in async code, after `ensureLoaded()`. */
  modelRef: MutableRefObject<M>
  /** Lazy-load the model once and resolve when it can run; rejects if the load errored. */
  ensureLoaded: () => Promise<void>
  /** Optional warm-up: start downloading/loading before first use. */
  preload: () => void
  /** True while a load has been requested but hasn't finished (drive a spinner). */
  isLoading: boolean
}

/**
 * Drive an executorch model hook (useOCR / useSpeechToText / useLLM) lazily. Pass the hook
 * and its options; this owns the `enabled` flag (→ `preventLoad`), the one-time-load waiters,
 * and the ref to the current instance. Behaviour is identical to the per-context code it
 * replaces — only consolidated.
 */
export function useLazyModel<M extends LoadableModel, O extends object>(
  useModel: (opts: O & { preventLoad: boolean }) => M,
  options: O,
): LazyModel<M> {
  // Don't download until something actually needs the model.
  const [enabled, setEnabled] = useState(false)
  const model = useModel({ ...options, preventLoad: !enabled })

  // Latest instance in a ref so async callers read current load state (updated in an
  // effect, not during render; read only after an await, by which point effects flushed).
  const modelRef = useRef(model)
  useEffect(() => {
    modelRef.current = model
  })

  // Callers waiting for the model to finish its (one-time) load.
  const waitersRef = useRef<{ resolve: () => void; reject: (e: unknown) => void }[]>([])
  useEffect(() => {
    if (model.isReady) {
      waitersRef.current.forEach((w) => w.resolve())
      waitersRef.current = []
    } else if (model.error) {
      waitersRef.current.forEach((w) => w.reject(model.error))
      waitersRef.current = []
    }
  }, [model.isReady, model.error])

  const preload = useCallback(() => setEnabled(true), [])

  const ensureLoaded = useCallback(async () => {
    if (modelRef.current.isReady) return
    setEnabled(true) // kick off the lazy load
    await new Promise<void>((resolve, reject) => {
      if (modelRef.current.error) reject(modelRef.current.error)
      else waitersRef.current.push({ resolve, reject })
    })
  }, [])

  return {
    model,
    modelRef,
    ensureLoaded,
    preload,
    isLoading: enabled && !model.isReady && !model.error,
  }
}
