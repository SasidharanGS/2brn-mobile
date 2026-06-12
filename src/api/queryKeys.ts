// Centralized TanStack Query keys so invalidation stays consistent across screens.

export const queryKeys = {
  status: ['status'] as const,
  connectionInfo: ['connection-info'] as const,
  activities: (params: Record<string, string | undefined>) => ['activities', params] as const,
  captures: (date: string) => ['captures', date] as const,
  journal: (date: string) => ['journal', date] as const,
  blog: (date: string) => ['blog', date] as const,
  insightsSummary: (date: string, period: string) =>
    ['insights', 'summary', date, period] as const,
  settings: ['settings'] as const,
  instructions: ['instructions'] as const,
  sharedNotes: ['shared-notes'] as const,
}
