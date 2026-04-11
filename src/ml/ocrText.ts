// Pure text assembly for OCR results (Phase 1, Branch A). Kept free of any
// `react-native-executorch` import so it stays unit-testable in Node — same
// split as `similarity.ts` (pure) vs `embeddings.ts` (native model choice).

/**
 * A single detected text box. Structural subset of executorch's `OCRDetection`
 * (`{ text, bbox: { x1, y1, x2, y2 }, score }`), so detections pass directly.
 */
export interface OcrBox {
  text: string
  bbox: { x1: number; y1: number; x2: number; y2: number }
}

/**
 * Flatten OCR detections into reading-order text: group boxes into lines by
 * vertical proximity, order each line left-to-right, and join lines with
 * newlines. Empty/whitespace boxes are dropped.
 */
export function joinOcrText(detections: readonly OcrBox[]): string {
  const boxes = detections
    .map((d) => ({
      text: d.text.trim(),
      cy: (d.bbox.y1 + d.bbox.y2) / 2, // vertical center
      h: Math.abs(d.bbox.y2 - d.bbox.y1) || 1, // height (avoid 0)
      x: d.bbox.x1, // left edge, for ordering within a line
    }))
    .filter((b) => b.text.length > 0)
    .sort((a, b) => a.cy - b.cy)

  if (boxes.length === 0) return ''

  // Greedily group vertically-close boxes into the same line.
  const lines: (typeof boxes)[] = [[boxes[0]]]
  for (let i = 1; i < boxes.length; i++) {
    const cur = boxes[i]
    const line = lines[lines.length - 1]
    const ref = line[line.length - 1]
    const sameLine = Math.abs(cur.cy - ref.cy) <= Math.max(ref.h, cur.h) * 0.5
    if (sameLine) line.push(cur)
    else lines.push([cur])
  }

  return lines
    .map((line) =>
      [...line]
        .sort((a, b) => a.x - b.x)
        .map((b) => b.text)
        .join(' '),
    )
    .join('\n')
}
