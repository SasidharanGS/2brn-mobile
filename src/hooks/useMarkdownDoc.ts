// Shared data + mutations for a date-scoped markdown document — the journal and blog
// screens were ~90% identical (M1). This owns the query, the generate/save mutations, and
// the per-kind labels, returning a ready-to-spread prop bundle for <MarkdownDocView>. Each
// route keeps only its own chrome (the Journal tab vs. the stacked Blog screen).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/api/queryKeys'
import { useApi } from '@/connection/ConnectionContext'
import { relativeDay } from '@/utils/date'

export type MarkdownDocKind = 'journal' | 'blog'

const LABELS: Record<
  MarkdownDocKind,
  { emptyTitle: string; generateLabel: string; reason: string }
> = {
  journal: {
    emptyTitle: 'No journal yet',
    generateLabel: 'Generate journal',
    reason: 'Generate one from your activity.',
  },
  blog: {
    emptyTitle: 'No blog post yet',
    generateLabel: 'Generate post',
    reason: 'Generate one from your day.',
  },
}

export function useMarkdownDoc(kind: MarkdownDocKind, date: string) {
  const api = useApi()
  const qc = useQueryClient()
  const key = kind === 'journal' ? queryKeys.journal(date) : queryKeys.blog(date)

  const doc = useQuery({
    queryKey: key,
    queryFn: () => (kind === 'journal' ? api.getJournal(date) : api.getBlogPost(date)),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: key })
  const generate = useMutation({
    mutationFn: () => (kind === 'journal' ? api.generateJournal(date) : api.generateBlogPost(date)),
    onSuccess: invalidate,
  })
  const save = useMutation({
    mutationFn: (content: string) =>
      kind === 'journal' ? api.updateJournal(date, content) : api.updateBlogPost(date, content),
    onSuccess: invalidate,
  })

  const noun = kind === 'journal' ? 'journal' : 'post'
  const labels = LABELS[kind]

  return {
    refreshing: doc.isRefetching,
    onRefresh: () => void doc.refetch(),
    /** Spread onto <MarkdownDocView key={date} {...docViewProps} />. */
    docViewProps: {
      content: doc.data?.content ?? null,
      generatedAt: doc.data?.generated_at,
      editedByUser: doc.data?.edited_by_user,
      loading: doc.isLoading,
      error: doc.error,
      generating: generate.isPending,
      saving: save.isPending,
      onRetry: () => void doc.refetch(),
      onGenerate: () => generate.mutate(),
      onSave: (t: string) => save.mutate(t),
      emptyTitle: labels.emptyTitle,
      emptyMessage: `There's no ${noun} for ${relativeDay(date)}. ${labels.reason}`,
      generateLabel: labels.generateLabel,
    },
  }
}
