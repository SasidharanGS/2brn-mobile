// Pure audio-waveform helpers for voice capture (Phase 1, Branch B). No native
// import, so unit-testable in Node — same split as ocrText.ts (pure) vs stt.ts
// (the executorch model choice).

/** Sample rate Whisper expects, in Hz. Record the mic at this rate (mono). */
export const STT_SAMPLE_RATE = 16000

/**
 * Concatenate the PCM chunks captured from the mic stream into one waveform,
 * in arrival order. Each chunk is float32 PCM in [-1, 1] (mono).
 */
export function concatFloat32(chunks: readonly Float32Array[]): Float32Array {
  let total = 0
  for (const c of chunks) total += c.length
  const out = new Float32Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

/** Largest absolute sample value (0..1) — used to tell silence from real speech. */
export function maxAbsAmplitude(waveform: Float32Array): number {
  let max = 0
  for (let i = 0; i < waveform.length; i++) {
    const a = Math.abs(waveform[i])
    if (a > max) max = a
  }
  return max
}

/** Waveform length in seconds, given its sample rate. */
export function durationSeconds(waveform: Float32Array, sampleRate = STT_SAMPLE_RATE): number {
  return sampleRate > 0 ? waveform.length / sampleRate : 0
}
