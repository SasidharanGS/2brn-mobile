import { describe, expect, it } from '@jest/globals'

import { ANSWER_SYSTEM_PROMPT, buildAnswerMessages } from '../prompt'

describe('buildAnswerMessages', () => {
  it('returns a system message then a user message', () => {
    const msgs = buildAnswerMessages('hi', [{ text: 'a note' }])
    expect(msgs.map((m) => m.role)).toEqual(['system', 'user'])
    expect(msgs[0].content).toBe(ANSWER_SYSTEM_PROMPT)
  })

  it('embeds the question in the user turn', () => {
    const msgs = buildAnswerMessages('how much does the database cost?', [{ text: 'pricing is $49' }])
    expect(msgs[1].content).toContain('Question: how much does the database cost?')
  })

  it('includes each source, numbered, with its title', () => {
    const msgs = buildAnswerMessages('q', [
      { text: 'first body', title: 'Alpha' },
      { text: 'second body' },
    ])
    const user = msgs[1].content
    expect(user).toContain('[Note 1: Alpha]')
    expect(user).toContain('first body')
    expect(user).toContain('[Note 2]')
    expect(user).toContain('second body')
  })

  it('trims the question and note text', () => {
    const msgs = buildAnswerMessages('  spaced  ', [{ text: '  padded note  ' }])
    expect(msgs[1].content).toContain('Question: spaced')
    expect(msgs[1].content).toContain('padded note\n')
  })

  it('signals when there are no matching notes', () => {
    const msgs = buildAnswerMessages('q', [])
    expect(msgs[1].content).toContain('(no matching notes found)')
  })
})
