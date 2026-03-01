import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/api/queryKeys'
import type { InsightsPeriod } from '@/api/types'
import { useApi } from '@/connection/ConnectionContext'

export function useStatus() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: () => api.getStatus(),
    refetchInterval: 30_000,
  })
}

export function useActivities(params: { date?: string; task_category?: string; productivity_state?: string }) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.activities(params),
    queryFn: () => api.getActivities(params),
  })
}

export function useJournal(date: string) {
  const api = useApi()
  return useQuery({ queryKey: queryKeys.journal(date), queryFn: () => api.getJournal(date) })
}

export function useBlog(date: string) {
  const api = useApi()
  return useQuery({ queryKey: queryKeys.blog(date), queryFn: () => api.getBlogPost(date) })
}

export function useInsightsSummary(date: string, period: InsightsPeriod) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.insightsSummary(date, period),
    queryFn: () => api.getInsightsSummary(date, period),
  })
}

export function useInstructions() {
  const api = useApi()
  return useQuery({ queryKey: queryKeys.instructions, queryFn: () => api.listInstructions() })
}

export function useSharedNotes() {
  const api = useApi()
  return useQuery({ queryKey: queryKeys.sharedNotes, queryFn: () => api.listSharedNotes() })
}

export function useSettings() {
  const api = useApi()
  return useQuery({ queryKey: queryKeys.settings, queryFn: () => api.getSettings() })
}
