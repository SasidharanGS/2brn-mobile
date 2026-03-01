import { type ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import { categoryChip, type ChipColors, stateChip } from '@/theme/colors'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className ?? ''}`}
    >
      {children}
    </View>
  )
}

export function ScreenTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <View className="mb-4">
      <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">{children}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</Text> : null}
    </View>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
  const palette: Record<ButtonVariant, string> = {
    primary: 'bg-primary active:opacity-80',
    secondary: 'border border-slate-300 dark:border-slate-700 active:opacity-70',
    danger: 'bg-red-500 active:opacity-80',
  }
  const textColor = variant === 'secondary' ? 'text-slate-900 dark:text-slate-100' : 'text-white'
  const isDisabled = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-xl px-4 py-3 ${palette[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#60a5fa' : '#fff'} />
      ) : (
        <Text className={`text-base font-semibold ${textColor}`}>{label}</Text>
      )}
    </Pressable>
  )
}

export function Chip({ label, colors }: { label: string; colors: ChipColors }) {
  return (
    <View style={{ backgroundColor: colors.bg }} className="flex-row items-center self-start rounded-full px-2.5 py-1">
      <View style={{ backgroundColor: colors.dot }} className="mr-1.5 h-1.5 w-1.5 rounded-full" />
      <Text style={{ color: colors.text }} className="text-xs font-semibold capitalize">
        {label}
      </Text>
    </View>
  )
}

export function CategoryChip({ category }: { category?: string | null }) {
  if (!category) return null
  return <Chip label={category} colors={categoryChip(category)} />
}

export function StateChip({ state }: { state?: string | null }) {
  if (!state) return null
  return <Chip label={state} colors={stateChip(state)} />
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</Text>
      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</Text>
      {hint ? <Text className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</Text> : null}
    </View>
  )
}
