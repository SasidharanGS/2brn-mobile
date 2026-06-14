import { describe, expect, it } from '@jest/globals'

import {
  getTokens,
  resolveMode,
  SKINS,
  THEME,
  THEME_MODES,
  themeVars,
  type ResolvedMode,
  type Skin,
} from '../tokens'

const RESOLVED: ResolvedMode[] = ['light', 'dark']
const HEX = /^#[0-9a-f]{6}$/i

describe('theme tokens', () => {
  it('exposes both skins and three modes', () => {
    expect(SKINS).toEqual(['modern', 'minimal'])
    expect(THEME_MODES).toEqual(['light', 'dark', 'system'])
  })

  it('defines a complete token set for every skin × resolved mode', () => {
    for (const skin of SKINS) {
      for (const mode of RESOLVED) {
        const t = THEME[skin][mode]
        const c = t.colors
        // every color is a valid hex
        for (const key of ['bg', 'surface', 'surface2', 'fg', 'muted', 'rule', 'border', 'accent', 'accentStrong'] as const) {
          expect(c[key]).toMatch(HEX)
        }
        // ink ramp is exactly 5 valid hex steps
        expect(c.ink).toHaveLength(5)
        for (const step of c.ink) expect(step).toMatch(HEX)
        expect(typeof t.radiusCard).toBe('number')
        expect(typeof t.radiusPill).toBe('number')
        expect(typeof t.lowercase).toBe('boolean')
      }
    }
  })

  it('encodes the minimal language: square cards, 3px pills, Inter, lowercase', () => {
    for (const mode of RESOLVED) {
      const t = THEME.minimal[mode]
      expect(t.radiusCard).toBe(0)
      expect(t.radiusPill).toBe(3)
      expect(t.fontSans).toBe('Inter')
      expect(t.lowercase).toBe(true)
    }
  })

  it('keeps modern rounded, system-font, and normal case', () => {
    for (const mode of RESOLVED) {
      const t = THEME.modern[mode]
      expect(t.radiusCard).toBeGreaterThan(0)
      expect(t.fontSans).toBeUndefined()
      expect(t.lowercase).toBe(false)
    }
  })

  it('uses the brand brick-red accent for minimal and blue for modern', () => {
    expect(THEME.minimal.light.colors.accent).toBe('#a23c2e')
    expect(THEME.modern.light.colors.accent).toBe('#60a5fa')
  })

  it('resolveMode passes explicit modes through and maps system to the OS scheme', () => {
    expect(resolveMode('light', 'dark')).toBe('light')
    expect(resolveMode('dark', 'light')).toBe('dark')
    expect(resolveMode('system', 'dark')).toBe('dark')
    expect(resolveMode('system', 'light')).toBe('light')
  })

  it('getTokens returns the matching token set', () => {
    for (const skin of SKINS as Skin[]) {
      for (const mode of RESOLVED) {
        expect(getTokens(skin, mode)).toBe(THEME[skin][mode])
      }
    }
  })

  it('themeVars maps every color to a `--`-prefixed CSS variable', () => {
    const t = THEME.minimal.light
    const v = themeVars(t)
    expect(v['--bg']).toBe(t.colors.bg)
    expect(v['--fg']).toBe(t.colors.fg)
    expect(v['--accent']).toBe(t.colors.accent)
    expect(v['--ink-0']).toBe(t.colors.ink[0])
    expect(v['--ink-4']).toBe(t.colors.ink[4])
    // 9 named colors + 5 ink steps = 14 variables, all `--`-prefixed
    expect(Object.keys(v)).toHaveLength(14)
    for (const key of Object.keys(v)) expect(key.startsWith('--')).toBe(true)
  })
})
