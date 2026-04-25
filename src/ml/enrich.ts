// Pure prompt + parsing for LLM auto-enrichment (Phase 2B): a one-line summary
// and a few topic tags for a captured note. Native-free, so unit-testable —
// mirrors prompt.ts / ocrText.ts. The LlmContext feeds buildEnrichMessages() to
// the stateless generate() and runs the raw output through parseEnrichment().
import type { ChatMessage } from './prompt'

export interface Enrichment {
  summary: string
  tags: string[]
}

/** Asks for a strict two-line reply that parseEnrichment() can read leniently. */
export const ENRICH_SYSTEM_PROMPT =
  'You label notes for a personal knowledge base. Given the note, reply with EXACTLY two lines and ' +
  'nothing else:\nSUMMARY: <one short sentence capturing the note>\nTAGS: <3-5 short lowercase topic ' +
  'tags, comma-separated>'

export function buildEnrichMessages(text: string): ChatMessage[] {
  return [
    { role: 'system', content: ENRICH_SYSTEM_PROMPT },
    { role: 'user', content: text.trim() },
  ]
}

const MAX_TAGS = 5

/**
 * Leniently parse the model's reply into a summary + tags. Tolerates case, a
 * leading "#" on tags, missing labels (falls back to the first line as summary),
 * and dedupes/caps the tags — small on-device models don't always obey formats.
 */
export function parseEnrichment(raw: string): Enrichment {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  let summary = ''
  let tags: string[] = []
  for (const line of lines) {
    const s = /^summary\s*:\s*(.+)$/i.exec(line)
    if (s && !summary) summary = s[1].trim()
    const t = /^tags?\s*:\s*(.+)$/i.exec(line)
    if (t && tags.length === 0) {
      tags = t[1].split(',').map((x) => x.trim().toLowerCase().replace(/^#/, ''))
    }
  }

  // Fallback: model ignored the format — use the first non-empty line as the summary.
  if (!summary && lines.length > 0) summary = lines[0].replace(/^summary\s*:\s*/i, '').trim()

  tags = [...new Set(tags.filter(Boolean))].slice(0, MAX_TAGS)
  return { summary, tags }
}
