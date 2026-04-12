import { describe, expect, it } from '@jest/globals'

import { concatFloat32, durationSeconds, maxAbsAmplitude } from '../audioWaveform'

describe('concatFloat32', () => {
  it('returns an empty waveform for no chunks', () => {
    expect(concatFloat32([])).toEqual(new Float32Array(0))
  })

  it('returns a single chunk unchanged', () => {
    // 0.5 / -0.25 are exactly representable in float32, so toEqual is safe.
    expect(Array.from(concatFloat32([new Float32Array([0.5, -0.25])]))).toEqual([0.5, -0.25])
  })

  it('joins chunks in arrival order', () => {
    const out = concatFloat32([new Float32Array([1, 2]), new Float32Array([3]), new Float32Array([4, 5])])
    expect(out.length).toBe(5)
    expect(Array.from(out)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('maxAbsAmplitude', () => {
  it('is 0 for silence (all zeros)', () => {
    expect(maxAbsAmplitude(new Float32Array([0, 0, 0]))).toBe(0)
  })

  it('is 0 for an empty waveform', () => {
    expect(maxAbsAmplitude(new Float32Array(0))).toBe(0)
  })

  it('finds the largest magnitude, including negatives', () => {
    expect(maxAbsAmplitude(new Float32Array([0.1, -0.8, 0.3]))).toBeCloseTo(0.8)
  })
})

describe('durationSeconds', () => {
  it('divides sample count by the sample rate', () => {
    expect(durationSeconds(new Float32Array(16000), 16000)).toBeCloseTo(1)
    expect(durationSeconds(new Float32Array(8000), 16000)).toBeCloseTo(0.5)
  })

  it('returns 0 for a non-positive sample rate', () => {
    expect(durationSeconds(new Float32Array(100), 0)).toBe(0)
  })
})
