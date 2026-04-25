// Lightweight persisted preferences (Phase 2B). Backed by SecureStore (already
// used for pairing) — fine for a simple on-device flag, no extra dependency.
import * as SecureStore from 'expo-secure-store'

const K_AUTO_ENRICH = 'twobrn.autoEnrich'

/**
 * Whether new captures are auto-enriched (one-line summary + tags) by the
 * on-device LLM. Default OFF — enrichment downloads a ~1 GB model and runs
 * inference per capture, so it's an explicit opt-in.
 */
export async function getAutoEnrich(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(K_AUTO_ENRICH)) === '1'
  } catch {
    return false
  }
}

export async function setAutoEnrich(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(K_AUTO_ENRICH, enabled ? '1' : '0')
}
