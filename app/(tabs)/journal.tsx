import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { queryKeys } from '@/api/queryKeys'
import { DateBar } from '@/components/DateBar'
import { MarkdownDocView } from '@/components/MarkdownDocView'
import { Screen } from '@/components/Screen'
import { ScreenTitle } from '@/components/ui'
import { useApi } from '@/connection/ConnectionContext'
import { useJournal } from '@/hooks/queries'
import { relativeDay, todayISODate } from '@/utils/date'

export default function JournalScreen() {
  const api = useApi()
  const qc = useQueryClient()
  const [date, setDate] = useState(todayISODate())
  const journal = useJournal(date)

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.journal(date) })
  const generate = useMutation({ mutationFn: () => api.generateJournal(date), onSuccess: invalidate })
  const save = useMutation({ mutationFn: (content: string) => api.updateJournal(date, content), onSuccess: invalidate })

  return (
    <Screen scroll refreshing={journal.isRefetching} onRefresh={() => void journal.refetch()}>
      <ScreenTitle>Journal</ScreenTitle>
      <DateBar date={date} onChange={setDate} />
      <MarkdownDocView
        content={journal.data?.content ?? null}
        generatedAt={journal.data?.generated_at}
        editedByUser={journal.data?.edited_by_user}
        loading={journal.isLoading}
        error={journal.error}
        generating={generate.isPending}
        saving={save.isPending}
        onRetry={() => void journal.refetch()}
        onGenerate={() => generate.mutate()}
        onSave={(t) => save.mutate(t)}
        emptyTitle="No journal yet"
        emptyMessage={`There's no journal for ${relativeDay(date)}. Generate one from your activity.`}
        generateLabel="Generate journal"
      />
    </Screen>
  )
}
