// Lightweight persisted preferences (Phase 2B). Backed by SecureStore (already
// used for pairing) — fine for a simple on-device flag, no extra dependency.
import * as SecureStore from 'expo-secure-store'

import type { Skin, ThemeMode } from '@/theme/tokens'

const K_AUTO_ENRICH = 'twobrn.autoEnrich'
const K_SKIN = 'twobrn.skin'
const K_THEME_MODE = 'twobrn.themeMode'

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

/** Persisted theme skin (modern/minimal). `null` = not yet chosen → use default. */
export async function getSkin(): Promise<Skin | null> {
  try {
    const v = await SecureStore.getItemAsync(K_SKIN)
    return v === 'modern' || v === 'minimal' ? v : null
  } catch {
    return null
  }
}

export async function setSkinPref(skin: Skin): Promise<void> {
  await SecureStore.setItemAsync(K_SKIN, skin)
}

/** Persisted theme mode (light/dark/system). `null` = not yet chosen → default. */
export async function getThemeMode(): Promise<ThemeMode | null> {
  try {
    const v = await SecureStore.getItemAsync(K_THEME_MODE)
    return v === 'light' || v === 'dark' || v === 'system' ? v : null
  } catch {
    return null
  }
}

export async function setThemeModePref(mode: ThemeMode): Promise<void> {
  await SecureStore.setItemAsync(K_THEME_MODE, mode)
}
