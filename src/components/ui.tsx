import { type ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, type TextStyle, View } from 'react-native'

import { categoryChip, type ChipColors, stateChip } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeContext'
import { inkColor, stateInk } from '@/theme/tokens'

/**
 * Per-skin text treatment. Modern keeps its Tailwind weight classes; minimal
 * switches to Inter, lowercases copy, and drops to weights 300/400 (never bold)
 * — the weight here overrides any `font-bold`/`font-semibold` className via style.
 */
function useSkinText(): { minimal: boolean; base: TextStyle; emphasis: TextStyle } {
  const { skin, tokens } = useTheme()
  const minimal = skin === 'minimal'
  const shared: TextStyle = {
    fontFamily: tokens.fontSans,
    textTransform: tokens.lowercase ? 'lowercase' : undefined,
  }
  return {
    minimal,
    base: { ...shared, fontWeight: minimal ? '300' : undefined },
    emphasis: { ...shared, fontWeight: minimal ? '400' : undefined },
  }
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  const { skin, tokens } = useTheme()
  return (
    <View
      className={`rounded-2xl border border-border bg-surface p-4 ${className ?? ''}`}
      style={skin === 'minimal' ? { borderRadius: tokens.radiusCard } : undefined}
    >
      {children}
    </View>
  )
}

export function ScreenTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  const { emphasis, base } = useSkinText()
  return (
    <View className="mb-4">
      <Text className="text-3xl font-bold text-fg" style={emphasis}>
        {children}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-sm text-muted" style={base}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { base } = useSkinText()
  return (
    <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted" style={base}>
      {children}
    </Text>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'danger'

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
}: {
  label: string
  onPress?: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  className?: string
}) {
  const { skin, tokens } = useTheme()
  const { emphasis } = useSkinText()
  const minimal = skin === 'minimal'
  const palette: Record<ButtonVariant, string> = {
    primary: 'bg-accent active:opacity-80',
    secondary: 'border border-border active:opacity-70',
    danger: 'bg-red-500 active:opacity-80',
  }
  // Solid buttons use the page bg as their label color in minimal (accent fill →
  // bg text); modern keeps white. Secondary reads as foreground in both.
  const labelColor =
    variant === 'secondary' ? tokens.colors.fg : minimal ? tokens.colors.bg : '#ffffff'
  const isDisabled = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-xl px-4 py-3 ${palette[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      style={minimal ? { borderRadius: 0 } : undefined}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? tokens.colors.accent : labelColor} />
      ) : (
        <Text className="text-base font-semibold" style={[emphasis, { color: labelColor }]}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

export function Chip({ label, colors }: { label: string; colors: ChipColors }) {
  const { skin, tokens } = useTheme()
  const { emphasis } = useSkinText()
  return (
    <View
      style={{ backgroundColor: colors.bg, borderRadius: skin === 'minimal' ? tokens.radiusPill : 9999 }}
      className="flex-row items-center self-start px-2.5 py-1"
    >
      <View
        style={{ backgroundColor: colors.dot, borderRadius: skin === 'minimal' ? tokens.radiusPill : 9999 }}
        className="mr-1.5 h-1.5 w-1.5"
      />
      <Text style={[emphasis, { color: colors.text }]} className="text-xs font-semibold capitalize">
        {label}
      </Text>
    </View>
  )
}

export function CategoryChip({ category }: { category?: string | null }) {
  const { skin, tokens } = useTheme()
  if (!category) return null
  // Minimal: category is neutral (no hue) — a quiet pill in the rule tint.
  if (skin === 'minimal') {
    return (
      <View
        style={{ backgroundColor: tokens.colors.rule, borderRadius: tokens.radiusPill }}
        className="self-start px-2 py-0.5"
      >
        <Text
          style={{ color: tokens.colors.muted, fontFamily: tokens.fontSans, textTransform: 'lowercase' }}
          className="text-xs"
        >
          {category}
        </Text>
      </View>
    )
  }
  return <Chip label={category} colors={categoryChip(category)} />
}

export function StateChip({ state }: { state?: string | null }) {
  const { skin, tokens } = useTheme()
  if (!state) return null
  // Minimal: state encoded by intensity — an ink-ramp square + label, never hue.
  if (skin === 'minimal') {
    return (
      <View className="flex-row items-center self-start" style={{ gap: 6 }}>
        <View style={{ width: 7, height: 7, backgroundColor: inkColor(tokens, stateInk(state)) }} />
        <Text
          style={{ color: tokens.colors.muted, fontFamily: tokens.fontSans, textTransform: 'lowercase' }}
          className="text-xs"
        >
          {state}
        </Text>
      </View>
    )
  }
  return <Chip label={state} colors={stateChip(state)} />
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const { emphasis, base } = useSkinText()
  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-fg" style={emphasis}>
        {value}
      </Text>
      <Text className="mt-0.5 text-xs text-muted" style={base}>
        {label}
      </Text>
      {hint ? (
        <Text className="text-[11px] text-muted" style={base}>
          {hint}
        </Text>
      ) : null}
    </View>
  )
}
