import { colorScheme as nwColorScheme, vars } from 'nativewind'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Appearance, View } from 'react-native'

import { getSkin, getThemeMode, setSkinPref, setThemeModePref } from '@/settings/prefs'

import {
  getTokens,
  resolveMode,
  themeVars,
  type ResolvedMode,
  type Skin,
  type ThemeMode,
  type ThemeTokens,
} from './tokens'

interface ThemeContextValue {
  skin: Skin
  mode: ThemeMode
  resolvedMode: ResolvedMode
  tokens: ThemeTokens
  setSkin: (skin: Skin) => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemScheme(): ResolvedMode {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
}

/**
 * Holds the active skin + mode, persists them, resolves `system` against the OS
 * scheme, and injects the resulting color tokens as CSS variables for the whole
 * tree (via NativeWind `vars()`). Also mirrors the resolved mode into NativeWind's
 * color scheme so any not-yet-migrated `dark:` utilities track the chosen mode too.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [skin, setSkinState] = useState<Skin>('modern')
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [scheme, setScheme] = useState<ResolvedMode>(systemScheme)

  // Hydrate persisted prefs once on mount.
  useEffect(() => {
    let active = true
    void (async () => {
      const [savedSkin, savedMode] = await Promise.all([getSkin(), getThemeMode()])
      if (!active) return
      if (savedSkin) setSkinState(savedSkin)
      if (savedMode) setModeState(savedMode)
    })()
    return () => {
      active = false
    }
  }, [])

  // Track OS scheme changes (only matters while mode === 'system').
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setScheme(colorScheme === 'dark' ? 'dark' : 'light'),
    )
    return () => sub.remove()
  }, [])

  const resolvedMode = resolveMode(mode, scheme)
  const tokens = getTokens(skin, resolvedMode)

  // Keep NativeWind's scheme in sync so legacy `dark:` classes follow our mode.
  useEffect(() => {
    nwColorScheme.set(mode)
  }, [mode])

  const setSkin = (next: Skin) => {
    setSkinState(next)
    void setSkinPref(next)
  }
  const setMode = (next: ThemeMode) => {
    setModeState(next)
    void setThemeModePref(next)
  }

  const value = useMemo<ThemeContextValue>(
    () => ({ skin, mode, resolvedMode, tokens, setSkin, setMode }),
    [skin, mode, resolvedMode, tokens],
  )

  const styleVars = useMemo(() => vars(themeVars(tokens)), [tokens])

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, styleVars]}>{children}</View>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
