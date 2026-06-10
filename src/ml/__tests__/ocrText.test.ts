import { describe, expect, it } from '@jest/globals'

import { joinOcrText, type OcrBox } from '../ocrText'

// Build a box from text and pixel coords (x1,y1 = top-left, x2,y2 = bottom-right).
const box = (text: string, x1: number, y1: number, x2: number, y2: number): OcrBox => ({
  text,
  bbox: { x1, y1, x2, y2 },
})

describe('joinOcrText', () => {
  it('returns an empty string for no detections', () => {
    expect(joinOcrText([])).toBe('')
  })

  it('returns the trimmed text of a single box', () => {
    expect(joinOcrText([box('  hello  ', 0, 0, 50, 20)])).toBe('hello')
  })

  it('orders boxes on the same line left-to-right, joined by spaces', () => {
    // "World" given first but sits to the right → "Hello World".
    const out = joinOcrText([box('World', 100, 2, 160, 22), box('Hello', 0, 0, 60, 20)])
    expect(out).toBe('Hello World')
  })

  it('separates vertically distant boxes onto their own lines, top first', () => {
    // Bottom line given first → top line still comes out first.
    const out = joinOcrText([box('second', 0, 40, 80, 60), box('first', 0, 0, 60, 20)])
    expect(out).toBe('first\nsecond')
  })

  it('reconstructs a multi-line layout in reading order', () => {
    const out = joinOcrText([
      box('pricing', 70, 0, 140, 20),
      box('database', 0, 0, 60, 20),
      box('2026', 0, 40, 50, 60),
    ])
    expect(out).toBe('database pricing\n2026')
  })

  it('drops empty / whitespace-only boxes', () => {
    const out = joinOcrText([box('keep', 0, 0, 40, 20), box('   ', 50, 0, 70, 20)])
    expect(out).toBe('keep')
  })
})
