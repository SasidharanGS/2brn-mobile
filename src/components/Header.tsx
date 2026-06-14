import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/theme/ThemeContext'

/** Lightweight back header for stacked (more/*) screens, themed per skin. */
export function Header({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { tokens } = useTheme()
  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-rule bg-bg">
      <View className="h-12 flex-row items-center px-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={tokens.colors.accent} />
        </Pressable>
        <Text
          className="flex-1 text-lg font-semibold text-fg"
          style={{
            fontFamily: tokens.fontSans,
            textTransform: tokens.lowercase ? 'lowercase' : undefined,
            fontWeight: tokens.lowercase ? '400' : undefined,
          }}
        >
          {title}
        </Text>
        {right ? <View className="pr-2">{right}</View> : null}
      </View>
    </View>
  )
}
