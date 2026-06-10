// Guards for externally-provided URLs before they reach Linking.openURL.
//
// A saved note's `source_url` comes from the desktop /ingest API and ultimately
// the Android share sheet — i.e. third-party-controlled input. Dispatching it
// blindly would let arbitrary schemes (tel:, sms:, file:, app deep links) fire,
// and openURL can reject/throw. We allow only absolute http(s) through, and the
// open never throws. This is the single source of truth for the http(s) check
// (pairing.ts reuses it too).
import { Linking } from 'react-native'

/** True only for an absolute http(s) URL. */
export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return /^https?:\/\/.+/i.test(value.trim())
}

/**
 * Open an externally-provided URL only if it is http(s). Returns whether it was
 * dispatched; never throws (a rejected openURL is swallowed). Use for any URL
 * that originated outside the app.
 */
export async function openExternalUrl(value: string | null | undefined): Promise<boolean> {
  if (!isHttpUrl(value)) return false
  try {
    await Linking.openURL(value!.trim())
    return true
  } catch {
    return false
  }
}
