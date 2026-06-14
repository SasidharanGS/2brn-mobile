import { ActivityIndicator, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { useTheme } from '@/theme/ThemeContext'
import { Button } from './ui'

export function Loading({ label }: { label?: string }) {
  const { tokens } = useTheme()
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color={tokens.colors.accent} />
      {label ? <Text className="mt-3 text-sm text-muted">{label}</Text> : null}
    </View>
  )
}

export function EmptyState({ title, message, icon }: { title: string; message?: string; icon?: string }) {
  const { tokens } = useTheme()
  const lc = { fontFamily: tokens.fontSans, textTransform: tokens.lowercase ? ('lowercase' as const) : undefined }
  return (
    <View className="items-center justify-center px-6 py-16">
      {icon ? <Text className="mb-2 text-4xl">{icon}</Text> : null}
      <Text className="text-center text-base font-semibold text-fg" style={lc}>
        {title}
      </Text>
      {message ? (
        <Text className="mt-1 text-center text-sm text-muted" style={lc}>
          {message}
        </Text>
      ) : null}
    </View>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { tokens } = useTheme()
  const lc = { fontFamily: tokens.fontSans, textTransform: tokens.lowercase ? ('lowercase' as const) : undefined }
  const offline = error instanceof ApiError && error.status === 0
  const title = offline ? "Can't reach your desktop" : 'Something went wrong'
  const message = offline
    ? 'Make sure your desktop 2brn is running, both devices share the same Wi-Fi, and LAN access is enabled.'
    : error instanceof Error
      ? error.message
      : 'Unknown error'
  return (
    <View className="items-center justify-center px-6 py-16">
      <Text className="mb-2 text-4xl">{offline ? '📡' : '⚠️'}</Text>
      <Text className="text-center text-base font-semibold text-fg" style={lc}>
        {title}
      </Text>
      <Text className="mt-1 text-center text-sm text-muted" style={lc}>
        {message}
      </Text>
      {onRetry ? (
        <View className="mt-4 w-44">
          <Button label="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  )
}
