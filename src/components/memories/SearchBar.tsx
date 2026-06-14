import { Ionicons } from '@expo/vector-icons'
import { Pressable, TextInput, View } from 'react-native'

import { useTheme } from '@/theme/ThemeContext'

/** Controlled semantic-search input with a clear button. The parent owns the query state. */
export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
}: {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  onClear: () => void
}) {
  const { skin, tokens } = useTheme()
  const muted = tokens.colors.muted
  return (
    <View
      className="mb-3 flex-row items-center rounded-xl border border-border px-3"
      style={skin === 'minimal' ? { borderRadius: 0 } : undefined}
    >
      <Ionicons name="search" size={16} color={muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder="Search by meaning…"
        placeholderTextColor={muted}
        className="ml-2 flex-1 py-2 text-fg"
      />
      {value ? (
        <Pressable accessibilityLabel="Clear search" onPress={onClear}>
          <Ionicons name="close-circle" size={16} color={muted} />
        </Pressable>
      ) : null}
    </View>
  )
}
