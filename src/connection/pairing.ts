import { ApiError, createHttpClient } from '@/api/client'
import { isHttpUrl } from '@/utils/url'

export interface PairingPayload {
  baseUrl: string
  token: string
}

/**
 * Build the pairing deep link encoded in the desktop QR code:
 *   twobrn://pair?u=<encodeURIComponent(url)>&t=<encodeURIComponent(token)>
 * URI-encoding (not base64) keeps it decodable with the built-in
 * decodeURIComponent, with no atob polyfill needed in React Native.
 */
export function buildPairingUrl(baseUrl: string, token: string): string {
  return `twobrn://pair?u=${encodeURIComponent(baseUrl)}&t=${encodeURIComponent(token)}`
}

function normalize(baseUrl: string, token: string): PairingPayload | null {
  const url = baseUrl.trim().replace(/\/+$/, '')
  const tok = token.trim()
  if (!isHttpUrl(url) || !tok) return null
  return { baseUrl: url, token: tok }
}

/**
 * Parse a scanned/typed value into a pairing payload. Accepts the `twobrn://pair`
 * deep link, a bare query string, or a JSON object `{ baseUrl|url, token|t }`.
 * Returns null if it can't be interpreted as a valid {http(s) url, token}.
 */
export function parsePairingPayload(raw: string): PairingPayload | null {
  if (!raw) return null
  const trimmed = raw.trim()

  if (trimmed.startsWith('{')) {
    try {
      const o = JSON.parse(trimmed) as Record<string, unknown>
      const baseUrl = (o.baseUrl ?? o.url) as string | undefined
      const token = (o.token ?? o.t) as string | undefined
      if (typeof baseUrl === 'string' && typeof token === 'string') return normalize(baseUrl, token)
    } catch {
      return null
    }
    return null
  }

  const qIndex = trimmed.indexOf('?')
  if (qIndex === -1) return null
  const params = new Map<string, string>()
  for (const pair of trimmed.slice(qIndex + 1).split('&')) {
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    params.set(pair.slice(0, eq), pair.slice(eq + 1))
  }
  const u = params.get('u')
  const t = params.get('t')
  if (!u || !t) return null
  try {
    return normalize(decodeURIComponent(u), decodeURIComponent(t))
  } catch {
    return null
  }
}

export interface ConnectionCheck {
  ok: boolean
  version?: string
  error?: string
}

/**
 * Verify a candidate {baseUrl, token}: `/status` proves the daemon is reachable,
 * `/connection-info` (token-gated) proves the token is accepted. Maps failures to
 * friendly, actionable messages.
 */
export async function validateConnection(baseUrl: string, token: string): Promise<ConnectionCheck> {
  const client = createHttpClient({ baseUrl, token })
  try {
    const status = await client.getStatus()
    await client.getConnectionInfo()
    return { ok: true, version: status.daemon_version }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return { ok: false, error: 'That pairing token was rejected. Re-scan the QR code on your desktop.' }
    }
    if (e instanceof ApiError && e.status === 0) {
      return {
        ok: false,
        error: "Couldn't reach your desktop. Make sure both devices are on the same Wi-Fi and that LAN access is enabled in the desktop app.",
      }
    }
    return { ok: false, error: (e as Error).message || 'Connection failed.' }
  }
}
