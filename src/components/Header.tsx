import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PRIMARY } from '@/theme/colors'

/** Lightweight back header for stacked (more/*) screens, themed for dark/light. */
export function Header({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={{ paddingTop: insets.top }}
      className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
    >
      <View className="h-12 flex-row items-center px-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={PRIMARY} />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </Text>
        {right ? <View className="pr-2">{right}</View> : null}
      </View>
    </View>
  )
}
