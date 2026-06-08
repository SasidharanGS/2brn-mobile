import { describe, expect, it } from '@jest/globals'

import { createMockClient } from '../mock'

describe('createMockClient', () => {
  it('returns coherent status + insights fixtures', async () => {
    const c = createMockClient()
    const status = await c.getStatus()
    expect(status.status).toBe('capturing')
    const ins = await c.getInsightsSummary('2026-06-08', 'week')
    expect(ins.period).toBe('week')
    expect(ins.categories.length).toBeGreaterThan(0)
    expect(ins.hourly_heatmap).toHaveLength(24)
  })

  it('supports the shared-note CRUD lifecycle', async () => {
    const c = createMockClient()
    const before = await c.listSharedNotes()
    const created = await c.ingestNote({ text: 'remember this', title: 'T' })
    expect(created.ok).toBe(true)
    const after = await c.listSharedNotes()
    expect(after.length).toBe(before.length + 1)
    expect(after[0].id).toBe(created.id) // newest first
    await c.deleteSharedNote(created.id)
    const final = await c.listSharedNotes()
    expect(final.find((n) => n.id === created.id)).toBeUndefined()
  })

  it('supports instruction CRUD', async () => {
    const c = createMockClient()
    const created = await c.createInstruction('Tone', 'Be concise')
    const list = await c.listInstructions()
    expect(list.find((i) => i.id === created.id)?.title).toBe('Tone')
    await c.updateInstruction(created.id, { enabled: false })
    const updated = await c.listInstructions()
    expect(updated.find((i) => i.id === created.id)?.enabled).toBe(false)
    await c.deleteInstruction(created.id)
    expect((await c.listInstructions()).find((i) => i.id === created.id)).toBeUndefined()
  })

  it('streams a chat answer in chunks', async () => {
    const c = createMockClient()
    let chunks = 0
    let text = ''
    for await (const chunk of c.chatStream({ question: 'what did I do?' })) {
      chunks++
      text += chunk
    }
    expect(chunks).toBeGreaterThan(1)
    expect(text.length).toBeGreaterThan(0)
  })

  it('lets tests override individual methods', async () => {
    const c = createMockClient({ getStatus: async () => ({ status: 'paused', capture_count_today: 0, last_captured_at: null, daemon_version: 'x' }) })
    expect((await c.getStatus()).status).toBe('paused')
  })
})
