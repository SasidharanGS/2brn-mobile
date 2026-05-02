import { describe, expect, it } from '@jest/globals'

import type { LocalMemory } from '../../db/local'
import { rankBySimilarity } from '../search'

function mem(id: number, embedding: number[] | null): LocalMemory {
  return { id, text: `m${id}`, title: null, source: 'test', sourceUrl: null, createdAt: '', embedding, summary: null, tags: null }
}

describe('rankBySimilarity', () => {
  it('ranks the closest vector first', () => {
    const items = [mem(1, [1, 0, 0]), mem(2, [0, 1, 0]), mem(3, [0.9, 0.1, 0])]
    const hits = rankBySimilarity(items, [1, 0, 0])
    expect(hits[0].memory.id).toBe(1)
    expect(hits[1].memory.id).toBe(3)
    expect(hits[0].score).toBeGreaterThan(hits[1].score)
  })

  it('skips items without an embedding', () => {
    const hits = rankBySimilarity([mem(1, null), mem(2, [1, 0])], [1, 0])
    expect(hits).toHaveLength(1)
    expect(hits[0].memory.id).toBe(2)
  })

  it('skips embeddings of the wrong length', () => {
    const hits = rankBySimilarity([mem(1, [1, 0, 0]), mem(2, [1, 0])], [1, 0])
    expect(hits).toHaveLength(1)
    expect(hits[0].memory.id).toBe(2)
  })

  it('respects the limit', () => {
    const items = [mem(1, [1, 0]), mem(2, [0.9, 0.1]), mem(3, [0.8, 0.2])]
    expect(rankBySimilarity(items, [1, 0], 2)).toHaveLength(2)
  })
})
