// Semantic ranking for on-device search (Phase 0, Step 4). Pure given a query
// vector — unit-testable, no native deps. The `import type` below is erased at
// compile time, so this module never loads expo-sqlite.
import type { LocalMemory } from '../db/local'

import { cosineSimilarity } from './similarity'

export interface SearchHit {
  memory: LocalMemory
  score: number
}

/**
 * Rank memories by cosine similarity to a query vector, highest first.
 * Memories without a matching-length embedding are skipped (not yet indexed).
 */
export function rankBySimilarity(memories: LocalMemory[], queryVec: number[], limit = 25): SearchHit[] {
  return memories
    .filter((m): m is LocalMemory & { embedding: number[] } => m.embedding != null && m.embedding.length === queryVec.length)
    .map((m) => ({ memory: m, score: cosineSimilarity(m.embedding, queryVec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
