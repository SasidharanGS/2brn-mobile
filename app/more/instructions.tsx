import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Alert, Pressable, Switch, Text, TextInput, View } from 'react-native'

import { queryKeys } from '@/api/queryKeys'
import { Header } from '@/components/Header'
import { QueryState } from '@/components/QueryState'
import { Screen } from '@/components/Screen'
import { EmptyState } from '@/components/states'
import { Button, Card } from '@/components/ui'
import { useApi } from '@/connection/ConnectionContext'
import { useInstructions } from '@/hooks/queries'

type Editing = { id: number | 'new'; title: string; body: string } | null

export default function InstructionsScreen() {
  const api = useApi()
  const qc = useQueryClient()
  const q = useInstructions()
  const [editing, setEditing] = useState<Editing>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.instructions })
  const create = useMutation({
    mutationFn: (v: { title: string; body: string }) => api.createInstruction(v.title, v.body),
    onSuccess: () => {
      setEditing(null)
      void invalidate()
    },
  })
  // Editing an instruction's title/body — closes the form on success.
  const update = useMutation({
    mutationFn: (v: { id: number; title: string; body: string }) =>
      api.updateInstruction(v.id, { title: v.title, body: v.body }),
    onSuccess: () => {
      setEditing(null)
      void invalidate()
    },
  })
  // Inline enable/disable toggle — independent of the edit form, so flipping a row
  // never closes an open editor and its pending state never lights the Save button.
  const toggle = useMutation({
    mutationFn: (v: { id: number; enabled: boolean }) =>
      api.updateInstruction(v.id, { enabled: v.enabled }),
    onSuccess: invalidate,
  })
  const del = useMutation({
    mutationFn: (id: number) => api.deleteInstruction(id),
    onSuccess: invalidate,
  })

  const saving = create.isPending || update.isPending
  const items = q.data ?? []

  const onSave = () => {
    if (!editing) return
    const title = editing.title.trim()
    const body = editing.body.trim()
    if (!title || !body) {
      Alert.alert('Add a title and body', 'Both fields are required.')
      return
    }
    if (editing.id === 'new') create.mutate({ title, body })
    else update.mutate({ id: editing.id, title, body })
  }

  const confirmDelete = (id: number) =>
    Alert.alert('Delete instruction?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(id) },
    ])

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header
        title="Instructions"
        right={
          <Pressable
            accessibilityLabel="Add instruction"
            onPress={() => setEditing({ id: 'new', title: '', body: '' })}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="add" size={26} color="#60a5fa" />
          </Pressable>
        }
      />
      <Screen
        scroll
        topInset={false}
        refreshing={q.isRefetching}
        onRefresh={() => void q.refetch()}
      >
        {editing ? (
          <Card className="mb-4">
            <TextInput
              value={editing.title}
              onChangeText={(t) => setEditing({ ...editing, title: t })}
              placeholder="Title"
              placeholderTextColor="#94a3b8"
              className="mb-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            <TextInput
              value={editing.body}
              onChangeText={(t) => setEditing({ ...editing, body: t })}
              placeholder="e.g. Keep journal entries concise and first-person."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              className="mb-3 min-h-[90px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="Cancel" variant="secondary" onPress={() => setEditing(null)} />
              </View>
              <View className="flex-1">
                <Button label="Save" loading={saving} onPress={onSave} />
              </View>
            </View>
          </Card>
        ) : null}

        <QueryState
          query={q}
          isEmpty={() => items.length === 0 && !editing}
          empty={
            <EmptyState
              title="No instructions"
              message="Add guidance for how your journal and blog are written. Tap + to start."
              icon="📝"
            />
          }
        >
          {() =>
            items.map((it) => (
              <Card key={it.id} className="mb-2">
                <View className="flex-row items-start justify-between">
                  <Text className="flex-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {it.title}
                  </Text>
                  <Switch
                    value={it.enabled}
                    onValueChange={(enabled) => toggle.mutate({ id: it.id, enabled })}
                  />
                </View>
                <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">{it.body}</Text>
                <View className="mt-3 flex-row justify-end gap-1">
                  <Pressable
                    accessibilityLabel="Edit"
                    onPress={() => setEditing({ id: it.id, title: it.title, body: it.body })}
                    className="h-9 w-9 items-center justify-center"
                  >
                    <Ionicons name="pencil-outline" size={18} color="#60a5fa" />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Delete"
                    onPress={() => confirmDelete(it.id)}
                    className="h-9 w-9 items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={18} color="#f87171" />
                  </Pressable>
                </View>
              </Card>
            ))
          }
        </QueryState>
      </Screen>
    </View>
  )
}
