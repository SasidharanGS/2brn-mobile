// Category & productivity-state chip colors. Ported verbatim from the desktop UI
// (ui/src/utils/design.ts) so chips look identical across desktop and mobile.

export interface ChipColors {
  bg: string
  text: string
  dot: string
}

export const CATEGORY_CHIP: Record<string, ChipColors> = {
  work: { bg: 'rgba(96,165,250,0.16)', text: '#60a5fa', dot: '#60a5fa' },
  research: { bg: 'rgba(192,132,252,0.16)', text: '#c084fc', dot: '#c084fc' },
  play: { bg: 'rgba(52,211,153,0.16)', text: '#34d399', dot: '#34d399' },
  learning: { bg: 'rgba(251,191,36,0.16)', text: '#fbbf24', dot: '#fbbf24' },
  communication: { bg: 'rgba(45,212,191,0.16)', text: '#2dd4bf', dot: '#2dd4bf' },
  creative: { bg: 'rgba(244,114,182,0.16)', text: '#f472b6', dot: '#f472b6' },
  admin: { bg: 'rgba(148,163,184,0.16)', text: '#94a3b8', dot: '#94a3b8' },
  other: { bg: 'rgba(100,116,139,0.16)', text: '#94a3b8', dot: '#64748b' },
}

export const STATE_CHIP: Record<string, ChipColors> = {
  productive: { bg: 'rgba(52,211,153,0.16)', text: '#34d399', dot: '#34d399' },
  focused: { bg: 'rgba(52,211,153,0.16)', text: '#34d399', dot: '#34d399' },
  chilling: { bg: 'rgba(96,165,250,0.16)', text: '#60a5fa', dot: '#60a5fa' },
  procrastinating: { bg: 'rgba(248,113,113,0.16)', text: '#f87171', dot: '#f87171' },
  distracted: { bg: 'rgba(251,146,60,0.16)', text: '#fb923c', dot: '#fb923c' },
  'in-meeting': { bg: 'rgba(192,132,252,0.16)', text: '#c084fc', dot: '#c084fc' },
  idle: { bg: 'rgba(100,116,139,0.16)', text: '#94a3b8', dot: '#64748b' },
}

export function categoryChip(cat?: string | null): ChipColors {
  return CATEGORY_CHIP[cat ?? 'other'] ?? CATEGORY_CHIP.other
}

export function stateChip(state?: string | null): ChipColors {
  return STATE_CHIP[state ?? 'idle'] ?? STATE_CHIP.idle
}

// Brand accent, reused for the tab bar and primary actions.
export const PRIMARY = '#60a5fa'
