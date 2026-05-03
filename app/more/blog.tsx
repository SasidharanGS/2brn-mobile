import { useMutation, useQueryClient } from '@tanstack/react-query'
import { View } from 'react-native'
import { useState } from 'react'

import { queryKeys } from '@/api/queryKeys'
import { DateBar } from '@/components/DateBar'
import { Header } from '@/components/Header'
import { MarkdownDocView } from '@/components/MarkdownDocView'
import { Screen } from '@/components/Screen'
import { useApi } from '@/connection/ConnectionContext'
import { useBlog } from '@/hooks/queries'
import { relativeDay, todayISODate } from '@/utils/date'

export default function BlogScreen() {
  const api = useApi()
  const qc = useQueryClient()
  const [date, setDate] = useState(todayISODate())
  const blog = useBlog(date)

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.blog(date) })
  const generate = useMutation({ mutationFn: () => api.generateBlogPost(date), onSuccess: invalidate })
  const save = useMutation({ mutationFn: (content: string) => api.updateBlogPost(date, content), onSuccess: invalidate })

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Blog" />
      <Screen scroll topInset={false} refreshing={blog.isRefetching} onRefresh={() => void blog.refetch()}>
        <DateBar date={date} onChange={setDate} />
        <MarkdownDocView
          key={date}
          content={blog.data?.content ?? null}
          generatedAt={blog.data?.generated_at}
          editedByUser={blog.data?.edited_by_user}
          loading={blog.isLoading}
          error={blog.error}
          generating={generate.isPending}
          saving={save.isPending}
          onRetry={() => void blog.refetch()}
          onGenerate={() => generate.mutate()}
          onSave={(t) => save.mutate(t)}
          emptyTitle="No blog post yet"
          emptyMessage={`There's no post for ${relativeDay(date)}. Generate one from your day.`}
          generateLabel="Generate post"
        />
      </Screen>
    </View>
  )
}
