import { describe, expect, it } from '@jest/globals'

import { buildEnrichMessages, ENRICH_SYSTEM_PROMPT, parseEnrichment } from '../enrich'

describe('buildEnrichMessages', () => {
  it('returns a system instruction then the trimmed note', () => {
    const msgs = buildEnrichMessages('  remember the milk  ')
    expect(msgs.map((m) => m.role)).toEqual(['system', 'user'])
    expect(msgs[0].content).toBe(ENRICH_SYSTEM_PROMPT)
    expect(msgs[1].content).toBe('remember the milk')
  })
})

describe('parseEnrichment', () => {
  it('parses a well-formed two-line reply', () => {
    const out = parseEnrichment('SUMMARY: Database pricing is $49/mo.\nTAGS: database, pricing, billing')
    expect(out.summary).toBe('Database pricing is $49/mo.')
    expect(out.tags).toEqual(['database', 'pricing', 'billing'])
  })

  it('is case-insensitive and strips leading # on tags', () => {
    const out = parseEnrichment('summary: Note about travel\ntags: #Travel, Japan, #FOOD')
    expect(out.summary).toBe('Note about travel')
    expect(out.tags).toEqual(['travel', 'japan', 'food'])
  })

  it('dedupes tags and caps at five', () => {
    const out = parseEnrichment('SUMMARY: x\nTAGS: a, a, b, c, d, e, f, g')
    expect(out.tags).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('falls back to the first line as summary when unlabeled', () => {
    const out = parseEnrichment('Just some freeform text the model returned')
    expect(out.summary).toBe('Just some freeform text the model returned')
    expect(out.tags).toEqual([])
  })

  it('handles empty / whitespace output', () => {
    expect(parseEnrichment('   \n  ')).toEqual({ summary: '', tags: [] })
  })

  it('ignores extra prose around the two lines', () => {
    const out = parseEnrichment('Sure!\nSUMMARY: Meeting notes\nTAGS: work, q3\nHope that helps.')
    expect(out.summary).toBe('Meeting notes')
    expect(out.tags).toEqual(['work', 'q3'])
  })
})
