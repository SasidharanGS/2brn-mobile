import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Alert, Linking, Pressable, Text, View } from 'react-native'

import { queryKeys } from '@/api/queryKeys'
import { Header } from '@/components/Header'
import { Screen } from '@/components/Screen'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { Card } from '@/components/ui'
import { useApi } from '@/connection/ConnectionContext'
import { useSharedNotes } from '@/hooks/queries'
import { prettyTime } from '@/utils/date'

export default function SavedScreen() {
  const api = useApi()
  const qc = useQueryClient()
  const router = useRouter()
  const q = useSharedNotes()
  const del = useMutation({
    mutationFn: (id: number) => api.deleteSharedNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sharedNotes }),
  })

  const confirmDelete = (id: number) =>
    Alert.alert('Delete note?', 'This removes it from your second brain.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(id) },
    ])

  const notes = q.data ?? []

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header
        title="Saved"
        right={
          <Pressable accessibilityLabel="Add a note" onPress={() => router.push('/share')} className="h-10 w-10 items-center justify-center">
            <Ionicons name="add" size={26} color="#60a5fa" />
          </Pressable>
        }
      />
      <Screen scroll topInset={false} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
        {q.isLoading ? (
          <Loading />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        ) : notes.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            message="Share a web page or text into 2brn from any app, or tap + to add a note."
            icon="🔖"
          />
        ) : (
          notes.map((n) => (
            <Card key={n.id} className="mb-2">
              {n.title ? (
                <Text className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">{n.title}</Text>
              ) : null}
              <Text numberOfLines={4} className="text-sm text-slate-700 dark:text-slate-300">
                {n.text}
              </Text>
              {n.source_url ? (
                <Text
                  onPress={() => void Linking.openURL(n.source_url as string)}
                  numberOfLines={1}
                  className="mt-1 text-xs text-primary"
                >
                  {n.source_url}
                </Text>
              ) : null}
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-[11px] text-slate-400 dark:text-slate-500">
                  {prettyTime(n.created_at)} · {n.embedded ? 'searchable' : 'pending'}
                </Text>
                <Pressable
                  accessibilityLabel="Delete note"
                  onPress={() => confirmDelete(n.id)}
                  className="h-8 w-8 items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={18} color="#f87171" />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </Screen>
    </View>
  )
}
