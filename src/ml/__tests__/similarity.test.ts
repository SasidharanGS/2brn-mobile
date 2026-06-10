import { describe, expect, it } from '@jest/globals'

import { cosineSimilarity } from '../similarity'

describe('cosineSimilarity', () => {
  it('is 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })

  it('is 1 for parallel (scaled) vectors', () => {
    expect(cosineSimilarity([1, 2], [2, 4])).toBeCloseTo(1)
  })

  it('is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it('is -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1)
  })

  it('accepts Float32Array (as returned by the embeddings model)', () => {
    const a = new Float32Array([0.1, 0.2, 0.3])
    const b = new Float32Array([0.1, 0.2, 0.3])
    expect(cosineSimilarity(a, b)).toBeCloseTo(1)
  })

  it('returns 0 when a vector is all zeros', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
  })

  it('throws on length mismatch', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(/length mismatch/)
  })
})
