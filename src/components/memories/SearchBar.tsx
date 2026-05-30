import { Ionicons } from '@expo/vector-icons'
import { Pressable, TextInput, View } from 'react-native'

import { MUTED } from '@/theme/colors'

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
  return (
    <View className="mb-3 flex-row items-center rounded-xl border border-slate-300 px-3 dark:border-slate-700">
      <Ionicons name="search" size={16} color={MUTED} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder="Search by meaning…"
        placeholderTextColor={MUTED}
        className="ml-2 flex-1 py-2 text-slate-900 dark:text-slate-100"
      />
      {value ? (
        <Pressable accessibilityLabel="Clear search" onPress={onClear}>
          <Ionicons name="close-circle" size={16} color={MUTED} />
        </Pressable>
      ) : null}
    </View>
  )
}
