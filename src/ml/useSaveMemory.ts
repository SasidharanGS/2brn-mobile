// Shared capture save path (M4). Both capture surfaces — the on-device home
// (memories.tsx) and the share sheet (share.tsx) — save the same way: embed the text
// on-device if the model is ready, persist to the local store, then fire best-effort
// auto-enrich in the background. Centralizing it keeps them in lockstep and gives one
// place to evolve when memory sync lands (Phase 3).
import { useCallback, useEffect } from 'react'

import { insertMemory, type NewMemory } from '@/db/local'

import { useEmbeddings } from './EmbeddingsContext'
import { useAutoEnrich } from './useAutoEnrich'

/** Everything insertMemory needs except the embedding, which this hook computes. */
export type SaveMemoryInput = Omit<NewMemory, 'embedding'>

export function useSaveMemory(): (
  input: SaveMemoryInput,
  onEnriched?: () => void,
) => Promise<number> {
  const { embed, preload } = useEmbeddings()
  const enrichInBackground = useAutoEnrich()

  // The capture surfaces use this hook, so warm up the (lazy, since M6) embedding model
  // when they mount. Paired-only companion screens never call this, so they don't pay the
  // ~90 MB download.
  useEffect(() => {
    preload()
  }, [preload])

  // Save a captured memory locally and kick off best-effort enrichment. embed() loads the
  // model on demand; if it can't load (e.g. an unsupported device) we still save the note
  // unindexed rather than fail the capture. `onEnriched` fires only if enrichment actually
  // updated the row, so callers can refresh.
  return useCallback(
    async (input, onEnriched) => {
      const text = input.text.trim()
      let embedding: number[] | null = null
      try {
        embedding = await embed(text)
      } catch {
        embedding = null
      }
      const id = await insertMemory({ ...input, text, embedding })
      void enrichInBackground(id, text).then((did) => {
        if (did) onEnriched?.()
      })
      return id
    },
    [embed, enrichInBackground],
  )
}
