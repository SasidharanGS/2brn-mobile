import { type ReactNode } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PRIMARY } from '@/theme/colors'

interface ScreenProps {
  children: ReactNode
  /** Wrap content in a scroll view (with optional pull-to-refresh). */
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  /** Apply safe-area top padding (default true). Tabs/headers may set false. */
  topInset?: boolean
}

const BG = 'flex-1 bg-slate-50 dark:bg-slate-950'

export function Screen({ children, scroll = false, refreshing, onRefresh, topInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets()
  const top = topInset ? insets.top : 0

  if (scroll) {
    return (
      <ScrollView
        className={BG}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
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
