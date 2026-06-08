import { ActivityIndicator, Text, View } from 'react-native'

import { ApiError } from '@/api/client'
import { PRIMARY } from '@/theme/colors'
import { Button } from './ui'

export function Loading({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color={PRIMARY} />
      {label ? <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">{label}</Text> : null}
    </View>
  )
}

export function EmptyState({ title, message, icon }: { title: string; message?: string; icon?: string }) {
  return (
    <View className="items-center justify-center px-6 py-16">
      {icon ? <Text className="mb-2 text-4xl">{icon}</Text> : null}
      <Text className="text-center text-base font-semibold text-slate-700 dark:text-slate-200">{title}</Text>
      {message ? (
        <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">{message}</Text>
      ) : null}
    </View>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
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
      <Text className="text-center text-base font-semibold text-slate-700 dark:text-slate-200">{title}</Text>
      <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">{message}</Text>
      {onRetry ? (
        <View className="mt-4 w-44">
          <Button label="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  )
}
