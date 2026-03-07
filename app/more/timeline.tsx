import { useState } from 'react'
import { Text, View } from 'react-native'

import { DateBar } from '@/components/DateBar'
import { Header } from '@/components/Header'
import { Screen } from '@/components/Screen'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { Card, CategoryChip, StateChip } from '@/components/ui'
import { useActivities } from '@/hooks/queries'
import { prettyTime, relativeDay, todayISODate } from '@/utils/date'

export default function TimelineScreen() {
  const [date, setDate] = useState(todayISODate())
  const q = useActivities({ date })
  const activities = [...(q.data ?? [])].sort((a, b) => a.started_at.localeCompare(b.started_at))

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Timeline" />
      <Screen scroll topInset={false} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
        <DateBar date={date} onChange={setDate} />
        {q.isLoading ? (
          <Loading />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        ) : activities.length === 0 ? (
          <EmptyState title="Nothing recorded" message={`No activity captured for ${relativeDay(date)}.`} icon="🕑" />
        ) : (
          activities.map((a) => (
            <Card key={a.id} className="mb-2">
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">{prettyTime(a.started_at)}</Text>
              </View>
              <Text className="text-sm text-slate-800 dark:text-slate-100">{a.summary ?? 'No summary'}</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <CategoryChip category={a.task_category} />
                <StateChip state={a.productivity_state} />
              </View>
            </Card>
          ))
        )}
      </Screen>
    </View>
  )
}
