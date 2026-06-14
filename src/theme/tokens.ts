// ── Theme token system ────────────────────────────────────────────────────────
// Two switchable skins (modern + minimal), each with light/dark, mirroring the
// desktop app. Colors are injected as CSS variables (via NativeWind `vars()`) so
// Tailwind classes like `bg-bg` / `text-fg` / `border-rule` resolve per skin;
// radius + font are exposed as raw values for the few places that need them.
//
// Minimal values come from the mobile design handoff (and match desktop's
// minimal.css). Modern is the app's current slate/blue look, formalised into
// tokens so it stays regression-free. The `--ink` intensity ramp is PRECOMPUTED
// to hex here — React Native can't evaluate CSS `color-mix()` at runtime.

export type Skin = 'modern' | 'minimal'
export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedMode = 'light' | 'dark'

export const SKINS: readonly Skin[] = ['modern', 'minimal'] as const
export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'] as const

export interface ThemeColors {
  bg: string
  surface: string
  surface2: string
  fg: string
  muted: string
  rule: string
  border: string
  accent: string
  accentStrong: string
  /** Monochrome intensity ramp 0→4 (idle→peak). Encodes state in the minimal skin. */
  ink: [string, string, string, string, string]
}

export interface ThemeTokens {
  colors: ThemeColors
  /** Card / surface corner radius (px). Minimal is square (0). */
  radiusCard: number
  /** Pill / chip / bubble radius (px). The only radius in the minimal system (3). */
  radiusPill: number
  /** Body font family. `undefined` = the platform system font (modern). */
  fontSans?: string
  /** Whether copy should read lowercase (minimal design rule). */
  lowercase: boolean
}

export const THEME: Record<Skin, Record<ResolvedMode, ThemeTokens>> = {
  modern: {
    light: {
      colors: {
        bg: '#f8fafc',
        surface: '#ffffff',
        surface2: '#f1f5f9',
        fg: '#0f172a',
        muted: '#64748b',
        rule: '#e2e8f0',
        border: '#e2e8f0',
        accent: '#60a5fa',
        accentStrong: '#3b82f6',
        ink: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#475569', '#0f172a'],
      },
      radiusCard: 16,
      radiusPill: 9999,
      fontSans: undefined,
      lowercase: false,
    },
    dark: {
      colors: {
        bg: '#020617',
        surface: '#0f172a',
        surface2: '#1e293b',
        fg: '#f8fafc',
        muted: '#94a3b8',
        rule: '#1e293b',
        border: '#334155',
        accent: '#60a5fa',
        accentStrong: '#3b82f6',
        ink: ['#1e293b', '#334155', '#64748b', '#94a3b8', '#f8fafc'],
      },
      radiusCard: 16,
      radiusPill: 9999,
      fontSans: undefined,
      lowercase: false,
    },
  },
  minimal: {
    light: {
      colors: {
        bg: '#f5f5f0',
        surface: '#f5f5f0',
        surface2: '#f5f5f0',
        fg: '#181818',
        muted: '#8c8c85',
        rule: '#dddddd',
        border: '#dddddd',
        accent: '#a23c2e',
        accentStrong: '#88301f',
        ink: ['#dddddd', '#cdcdc9', '#a1a19e', '#6c6c6a', '#333332'],
      },
      radiusCard: 0,
      radiusPill: 3,
      fontSans: 'Inter',
      lowercase: true,
    },
    dark: {
      colors: {
        bg: '#181818',
        surface: '#181818',
        surface2: '#181818',
        fg: '#f5f5f0',
        muted: '#666666',
        rule: '#2e2e2e',
        border: '#2e2e2e',
        accent: '#d2705f',
        accentStrong: '#e08573',
        ink: ['#2e2e2e', '#40403f', '#6c6c6a', '#a1a19e', '#dadad6'],
      },
      radiusCard: 0,
      radiusPill: 3,
      fontSans: 'Inter',
      lowercase: true,
    },
  },
}

/**
 * Productivity state → intensity-ramp level (0–4). The minimal skin encodes state
 * by magnitude on the monochrome `--ink` ramp, never by hue (mirrors the desktop
 * minimal skin). idle → empty, deep work/focused → peak.
 */
export const STATE_INK: Record<string, number> = {
  deep_work: 4,
  focused: 4,
  productive: 3,
  'in-meeting': 2,
  communication: 2,
  chilling: 1,
  distracted: 1,
  procrastinating: 1,
  idle: 0,
}

export function stateInk(state: string | null | undefined): number {
  return STATE_INK[state ?? ''] ?? 0
}

/** The ink-ramp hex for a level, clamped to 0–4. */
export function inkColor(tokens: ThemeTokens, level: number): string {
  return tokens.colors.ink[Math.max(0, Math.min(4, level))]
}

/** Resolve a (possibly `system`) mode to a concrete light/dark using the OS scheme. */
export function resolveMode(mode: ThemeMode, systemScheme: ResolvedMode): ResolvedMode {
  return mode === 'system' ? systemScheme : mode
}

/** Look up the active token set. */
export function getTokens(skin: Skin, resolved: ResolvedMode): ThemeTokens {
  return THEME[skin][resolved]
}

/** Map a token set's colors to the CSS-variable object consumed by NativeWind `vars()`. */
export function themeVars(t: ThemeTokens): Record<string, string> {
  const c = t.colors
  return {
    '--bg': c.bg,
    '--surface': c.surface,
    '--surface-2': c.surface2,
    '--fg': c.fg,
    '--muted': c.muted,
    '--rule': c.rule,
    '--border': c.border,
    '--accent': c.accent,
    '--accent-strong': c.accentStrong,
    '--ink-0': c.ink[0],
    '--ink-1': c.ink[1],
    '--ink-2': c.ink[2],
    '--ink-3': c.ink[3],
    '--ink-4': c.ink[4],
  }
}
