// Pure prompt construction for the on-device LLM (Phase 2). No native import, so
// it's unit-testable in Node — same split as ocrText.ts / audioWaveform.ts. The
// LlmContext passes the result straight to executorch's generate() (the shape is
// structurally compatible with its `Message` type).

/** A chat message — structural match for executorch's `Message` (role + content). */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** A retrieved memory used as grounding context for an answer. */
export interface AnswerSource {
  text: string
  title?: string | null
}

/** Instruction that keeps answers grounded in the user's own notes (no hallucination). */
export const ANSWER_SYSTEM_PROMPT =
  "You are 2brn, the user's personal second brain. Answer the question using ONLY the notes provided " +
  "below. If the notes don't contain the answer, say you don't have a note about that — never make " +
  'things up. Be concise and direct, and write in the second person ("you").'

/**
 * Build the chat messages for a grounded ("RAG") answer: a system instruction plus
 * a user turn that embeds the retrieved notes as context, followed by the question.
 * With no sources the system prompt still applies (the model should decline).
 */
export function buildAnswerMessages(question: string, sources: readonly AnswerSource[]): ChatMessage[] {
  const notes = sources.length
    ? sources.map((s, i) => `[Note ${i + 1}${s.title ? `: ${s.title}` : ''}]\n${s.text.trim()}`).join('\n\n')
    : '(no matching notes found)'
  return [
    { role: 'system', content: ANSWER_SYSTEM_PROMPT },
    { role: 'user', content: `Notes:\n${notes}\n\nQuestion: ${question.trim()}` },
  ]
}
