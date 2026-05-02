// Background auto-enrichment (Phase 2B). Returns a fire-and-forget function that,
// IF the user enabled auto-enrich, summarizes + tags a freshly saved memory with
// the on-device LLM and stores the result. Best-effort: it never blocks or breaks
// a capture, and resolves to whether it actually enriched (so callers can refresh).
import { useCallback } from 'react'

import { updateMemoryEnrichment } from '@/db/local'
import { getAutoEnrich } from '@/settings/prefs'

import { useLlm } from './LlmContext'

export function useAutoEnrich(): (id: number, text: string) => Promise<boolean> {
  const { enrich } = useLlm()
  return useCallback(
    async (id, text) => {
      try {
        if (!text.trim() || !(await getAutoEnrich())) return false
        const { summary, tags } = await enrich(text)
        if (!summary && tags.length === 0) return false
        await updateMemoryEnrichment(id, summary, tags)
        return true
      } catch {
        return false // never let enrichment failure affect the capture
      }
    },
    [enrich],
  )
}
