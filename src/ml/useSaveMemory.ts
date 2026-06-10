// Shared capture save path (M4). Both capture surfaces — the on-device home
// (memories.tsx) and the share sheet (share.tsx) — save the same way: embed the text
// on-device if the model is ready, persist to the local store, then fire best-effort
// auto-enrich in the background. Centralizing it keeps them in lockstep and gives one
// place to evolve when memory sync lands (Phase 3).
import { useCallback } from 'react'

import { insertMemory, type NewMemory } from '@/db/local'

import { useEmbeddings } from './EmbeddingsContext'
import { useAutoEnrich } from './useAutoEnrich'

/** Everything insertMemory needs except the embedding, which this hook computes. */
export type SaveMemoryInput = Omit<NewMemory, 'embedding'>

export function useSaveMemory(): (
  input: SaveMemoryInput,
  onEnriched?: () => void,
) => Promise<number> {
  const { embed, isReady } = useEmbeddings()
  const enrichInBackground = useAutoEnrich()

  // Save a captured memory locally (embedding it if the model is ready) and kick off
  // best-effort enrichment. Returns the new row id; `onEnriched` fires only if enrichment
  // actually updated the row, so callers can refresh.
  return useCallback(
    async (input, onEnriched) => {
      const text = input.text.trim()
      const embedding = isReady ? await embed(text) : null
      const id = await insertMemory({ ...input, text, embedding })
      void enrichInBackground(id, text).then((did) => {
        if (did) onEnriched?.()
      })
      return id
    },
    [embed, isReady, enrichInBackground],
  )
}
