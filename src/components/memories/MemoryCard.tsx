import { Ionicons } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'

import { Card } from '@/components/ui'
import { type LocalMemory } from '@/db/local'
import { DANGER } from '@/theme/colors'
import { prettyTime } from '@/utils/date'

/** One saved memory in the on-device list: title/text/summary/tags + a match score and delete. */
export function MemoryCard({
  memory: m,
  score,
  onDelete,
}: {
  memory: LocalMemory
  score?: number
  onDelete: () => void
}) {
  return (
    <Card className="mb-2">
      {m.title ? (
        <Text className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          {m.title}
        </Text>
      ) : null}
      <Text numberOfLines={4} className="text-sm text-slate-700 dark:text-slate-300">
        {m.text}
      </Text>
      {m.summary ? (
        <Text className="mt-1.5 text-xs italic text-slate-500 dark:text-slate-400">
          {m.summary}
        </Text>
      ) : null}
      {m.tags && m.tags.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {m.tags.map((t) => (
            <Text
              key={t}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              #{t}
            </Text>
          ))}
        </View>
      ) : null}
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-[11px] text-slate-400 dark:text-slate-500">
          {prettyTime(m.createdAt)}
          {score !== undefined ? ` · ${Math.round(score * 100)}% match` : ''}
          {m.embedding ? '' : ' · not indexed'}
        </Text>
        <Pressable
          accessibilityLabel="Delete"
          onPress={onDelete}
          className="h-8 w-8 items-center justify-center"
        >
          <Ionicons name="trash-outline" size={18} color={DANGER} />
        </Pressable>
      </View>
    </Card>
  )
}
