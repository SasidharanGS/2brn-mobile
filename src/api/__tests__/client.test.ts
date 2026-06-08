import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { ApiError, createHttpClient } from '../client'

const mockFetch = jest.fn<(input: string, init?: RequestInit) => Promise<unknown>>()

beforeEach(() => {
  ;(globalThis as unknown as { fetch: unknown }).fetch = mockFetch
  mockFetch.mockReset()
})

function res(data: unknown, ok = true, status = 200) {
  return { ok, status, text: async () => (data === undefined ? '' : JSON.stringify(data)) }
}

const client = () => createHttpClient({ baseUrl: 'http://host:7842', token: 'tok' })
const lastCall = () => mockFetch.mock.calls[0] as unknown as [string, RequestInit]

describe('createHttpClient', () => {
  it('GETs status with a bearer token', async () => {
    mockFetch.mockResolvedValue(
      res({ status: 'capturing', capture_count_today: 5, last_captured_at: null, daemon_version: '0.1.0' }),
    )
    const s = await client().getStatus()
    expect(s.capture_count_today).toBe(5)
    const [url, init] = lastCall()
    expect(url).toBe('http://host:7842/status')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('throws ApiError on a non-ok response', async () => {
    mockFetch.mockResolvedValue(res(undefined, false, 500))
    await expect(client().getStatus()).rejects.toBeInstanceOf(ApiError)
  })

  it('maps a network failure to ApiError status 0', async () => {
    mockFetch.mockRejectedValue(new Error('offline'))
    await expect(client().getStatus()).rejects.toMatchObject({ status: 0 })
  })

  it('returns null for a 404 journal', async () => {
    mockFetch.mockResolvedValue(res(undefined, false, 404))
    await expect(client().getJournal('2026-06-08')).resolves.toBeNull()
  })

  it('drops undefined query params when listing activities', async () => {
    mockFetch.mockResolvedValue(res([]))
    await client().getActivities({ date: '2026-06-08', task_category: undefined })
    const [url] = lastCall()
    expect(url).toContain('/activities?date=2026-06-08')
    expect(url).not.toContain('task_category')
  })

  it('strips a trailing slash from baseUrl and POSTs the ingest body', async () => {
    mockFetch.mockResolvedValue(res({ ok: true, id: 7, embedded: false }))
    const c = createHttpClient({ baseUrl: 'http://host:7842/', token: 't' })
    const r = await c.ingestNote({ text: 'hi', title: 'T' })
    expect(r.id).toBe(7)
    const [url, init] = lastCall()
    expect(url).toBe('http://host:7842/ingest/note')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ text: 'hi', title: 'T' })
  })

  it('encodes the paused flag as a query param', async () => {
    mockFetch.mockResolvedValue(res({ ok: true, paused: true }))
    await client().setPaused(true)
    expect(lastCall()[0]).toBe('http://host:7842/settings/paused?paused=true')
  })
})
