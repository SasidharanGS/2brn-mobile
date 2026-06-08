import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { buildPairingUrl, parsePairingPayload, validateConnection } from '../pairing'

describe('parsePairingPayload', () => {
  it('parses a twobrn:// deep link', () => {
    expect(parsePairingPayload('twobrn://pair?u=http%3A%2F%2F192.168.1.23%3A7842&t=abc123')).toEqual({
      baseUrl: 'http://192.168.1.23:7842',
      token: 'abc123',
    })
  })

  it('round-trips buildPairingUrl', () => {
    const url = buildPairingUrl('http://10.0.0.5:7842', 'tok-EN_3')
    expect(parsePairingPayload(url)).toEqual({ baseUrl: 'http://10.0.0.5:7842', token: 'tok-EN_3' })
  })

  it('parses a JSON payload and strips a trailing slash', () => {
    expect(parsePairingPayload('{"baseUrl":"http://x:7842/","token":"t"}')).toEqual({
      baseUrl: 'http://x:7842',
      token: 't',
    })
  })

  it('rejects junk, missing fields, and non-http urls', () => {
    expect(parsePairingPayload('')).toBeNull()
    expect(parsePairingPayload('hello world')).toBeNull()
    expect(parsePairingPayload('twobrn://pair?u=http%3A%2F%2Fx%3A7842')).toBeNull() // no token
    expect(parsePairingPayload('twobrn://pair?u=ftp%3A%2F%2Fx&t=t')).toBeNull() // not http
  })
})

describe('validateConnection', () => {
  const mockFetch = jest.fn<(input: string, init?: RequestInit) => Promise<unknown>>()
  beforeEach(() => {
    ;(globalThis as unknown as { fetch: unknown }).fetch = mockFetch
    mockFetch.mockReset()
  })
  const ok = (data: unknown) => ({ ok: true, status: 200, text: async () => JSON.stringify(data) })
  const status = { status: 'capturing', capture_count_today: 1, last_captured_at: null, daemon_version: '9.9' }

  it('returns ok when status + connection-info succeed', async () => {
    mockFetch
      .mockResolvedValueOnce(ok(status))
      .mockResolvedValueOnce(ok({ hostname: 'h', port: 7842, lan_access: true, lan_urls: [] }))
    const r = await validateConnection('http://x:7842', 'tok')
    expect(r.ok).toBe(true)
    expect(r.version).toBe('9.9')
  })

  it('reports a rejected token on 401', async () => {
    mockFetch
      .mockResolvedValueOnce(ok(status))
      .mockResolvedValueOnce({ ok: false, status: 401, text: async () => '' })
    const r = await validateConnection('http://x:7842', 'bad')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/token/i)
  })

  it('reports unreachable on a network error', async () => {
    mockFetch.mockRejectedValue(new Error('no route'))
    const r = await validateConnection('http://x:7842', 'tok')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/reach|Wi-Fi/i)
  })
})
