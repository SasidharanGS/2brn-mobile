import { Pressable, Text, View } from 'react-native'

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
  return (
    <View className="mb-4 flex-row rounded-xl bg-surface-2 p-1">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            className={`flex-1 items-center rounded-lg py-2 ${active ? 'bg-surface' : ''}`}
          >
            <Text className={`text-sm font-medium ${active ? 'text-fg' : 'text-muted'}`}>
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
