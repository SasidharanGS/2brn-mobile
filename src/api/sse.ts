// Incremental parser for the daemon's chat stream. The daemon emits lines of the
// form `data: {"chunk": "..."}\n\n`, a terminal `data: [DONE]`, and on failure
// `data: {"error": "..."}`. This mirrors the desktop client's parsing, factored
// out as a pure, stateful parser so it can be unit-tested without a network.

export type SSEEvent =
  | { type: 'chunk'; value: string }
  | { type: 'error'; value: string }
  | { type: 'done' }

export class SSEParser {
  private buffer = ''

  /** Feed a chunk of decoded text; returns any complete events it unlocked. */
  push(text: string): SSEEvent[] {
    this.buffer += text
    const lines = this.buffer.split('\n')
    // Keep the last (possibly partial) line in the buffer for the next push.
    this.buffer = lines.pop() ?? ''
    return this.parseLines(lines)
  }

  /** Flush any remaining buffered line at end-of-stream. */
  flush(): SSEEvent[] {
    if (!this.buffer) return []
    const rest = this.buffer
    this.buffer = ''
    return this.parseLines([rest])
  }

  private parseLines(lines: string[]): SSEEvent[] {
    const events: SSEEvent[] = []
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') {
        events.push({ type: 'done' })
        continue
      }
      try {
        const parsed = JSON.parse(data) as { chunk?: unknown; error?: unknown }
        if (typeof parsed.chunk === 'string') {
          events.push({ type: 'chunk', value: parsed.chunk })
        } else if (typeof parsed.error === 'string') {
          events.push({ type: 'error', value: parsed.error })
        }
      } catch {
        // Ignore malformed/partial JSON — a later push may complete it, or the
        // daemon emitted a keep-alive we don't care about.
      }
    }
    return events
  }
}
