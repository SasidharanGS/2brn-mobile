import { type ReactNode } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/theme/ThemeContext'

interface ScreenProps {
  children: ReactNode
  /** Wrap content in a scroll view (with optional pull-to-refresh). */
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  /** Apply safe-area top padding (default true). Tabs/headers may set false. */
  topInset?: boolean
}

const BG = 'flex-1 bg-bg'

export function Screen({ children, scroll = false, refreshing, onRefresh, topInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets()
  const { tokens } = useTheme()
  const accent = tokens.colors.accent
  const top = topInset ? insets.top : 0

  if (scroll) {
    return (
      <ScrollView
        className={BG}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={accent} colors={[accent]} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    )
  }

  return (
    <View className={BG} style={{ paddingTop: top, paddingBottom: insets.bottom }}>
      {children}
    </View>
  )
}
