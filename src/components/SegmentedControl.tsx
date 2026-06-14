import { Pressable, Text, View } from 'react-native'

import { useTheme } from '@/theme/ThemeContext'

interface Option<T extends string> {
  label: string
  value: T
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
}) {
  const { skin, tokens } = useTheme()
  const minimal = skin === 'minimal'
  return (
    <View className={`mb-4 flex-row p-1 ${minimal ? 'border border-rule' : 'rounded-xl bg-surface-2'}`}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            className="flex-1 items-center py-2"
            style={{
              borderRadius: minimal ? 0 : 8,
              backgroundColor: active ? (minimal ? tokens.colors.accent : tokens.colors.surface) : 'transparent',
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{
                fontFamily: tokens.fontSans,
                textTransform: tokens.lowercase ? 'lowercase' : undefined,
                color: active ? (minimal ? tokens.colors.bg : tokens.colors.fg) : tokens.colors.muted,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
