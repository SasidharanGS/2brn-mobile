import { fetch as expoFetch } from 'expo/fetch'

import { SSEParser } from './sse'
import type {
  ActivityRecord,
  AppSettings,
  BlogPost,
  CaptureRecord,
  ConnectionInfo,
  DailyInsights,
  DaemonStatus,
  InsightsPeriod,
  InsightsSummary,
  JournalEntry,
  NoteIngestRequest,
  NoteIngestResponse,
  SharedNote,
  UserInstruction,
} from './types'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiConfig {
  baseUrl: string
  token: string
}

export interface ChatStreamOptions {
  question: string
  dateFilter?: string
  categoryFilter?: string
  signal?: AbortSignal
}

/** Build a client bound to a specific daemon base URL + bearer token. */
export function createHttpClient(cfg: ApiConfig) {
  const base = cfg.baseUrl.replace(/\/+$/, '')

  function headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { ...extra }
    if (cfg.token) h.Authorization = `Bearer ${cfg.token}`
    return h
  }

  async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const init: RequestInit = { method, headers: headers() }
    if (body !== undefined) {
      init.headers = headers({ 'Content-Type': 'application/json' })
      init.body = JSON.stringify(body)
    }
    let res: Response
    try {
      res = await fetch(`${base}${path}`, init)
    } catch (e) {
      throw new ApiError(0, `Network error reaching ${path}: ${(e as Error).message}`)
    }
    if (!res.ok) throw new ApiError(res.status, `${method} ${path} failed: ${res.status}`)
    // Some endpoints return empty bodies; guard JSON parsing.
    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  }

  const get = <T>(path: string) => req<T>('GET', path)
  const post = <T>(path: string, body?: unknown) => req<T>('POST', path, body ?? {})
  const put = <T>(path: string, body: unknown) => req<T>('PUT', path, body)
  const patch = <T>(path: string, body?: unknown) => req<T>('PATCH', path, body ?? {})
  const del = <T>(path: string) => req<T>('DELETE', path)

  async function* chatStream(opts: ChatStreamOptions): AsyncGenerator<string, void, unknown> {
    const res = await expoFetch(`${base}/chat`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        question: opts.question,
        date_filter: opts.dateFilter,
        category_filter: opts.categoryFilter,
      }),
      signal: opts.signal,
    })
    if (!res.ok) throw new ApiError(res.status, `POST /chat failed: ${res.status}`)

    const parser = new SSEParser()
    const emit = function* (events: ReturnType<SSEParser['push']>): Generator<string> {
      for (const ev of events) {
        if (ev.type === 'chunk') yield ev.value
        else if (ev.type === 'error') throw new ApiError(500, ev.value)
        else if (ev.type === 'done') return
      }
    }

    const body = res.body as ReadableStream<Uint8Array> | null
    if (!body) {
      // Buffered fallback when the runtime can't stream the response body.
      const text = await res.text()
      yield* emit(parser.push(text))
      yield* emit(parser.flush())
      return
    }

    const reader = body.getReader()
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) yield* emit(parser.push(decoder.decode(value, { stream: true })))
      }
      yield* emit(parser.flush())
    } finally {
      reader.releaseLock?.()
    }
  }

  return {
    // health / connection
    getStatus: () => get<DaemonStatus>('/status'),
    getConnectionInfo: () => get<ConnectionInfo>('/connection-info'),

    // activity data
    getActivities: (params: { date?: string; task_category?: string; productivity_state?: string }) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v) as [string, string][],
      )
      return get<ActivityRecord[]>(`/activities?${q}`)
    },
    getCaptures: (date: string) => get<CaptureRecord[]>(`/captures?date=${date}`),
    overrideActivity: (id: number, task_category: string, productivity_state: string) =>
      patch<ActivityRecord>(`/activities/${id}/override`, { task_category, productivity_state }),

    // journal
    getJournal: (date: string) =>
      get<JournalEntry>(`/journal/${date}`).catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }),
    generateJournal: (date: string) => post<unknown>(`/journal/${date}/generate`),
    updateJournal: (date: string, content: string) => put<unknown>(`/journal/${date}`, { content }),

    // blog
    getBlogPost: (date: string) =>
      get<BlogPost>(`/blog/${date}`).catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }),
    generateBlogPost: (date: string) =>
      post<{ ok: boolean; generated: boolean }>(`/blog/${date}/generate`),
    updateBlogPost: (date: string, content: string) =>
      put<{ ok: boolean }>(`/blog/${date}`, { content }),

    // insights
    getDailyInsights: (date: string) => get<DailyInsights>(`/insights/daily?date=${date}`),
    getInsightsSummary: (date: string, period: InsightsPeriod = 'day') =>
      get<InsightsSummary>(`/insights/summary?date=${date}&period=${period}`),

    // settings
    getSettings: () => get<AppSettings>('/settings'),
    setPaused: (paused: boolean) => post<{ ok: boolean; paused: boolean }>(`/settings/paused?paused=${paused}`),

    // instructions
    listInstructions: () => get<UserInstruction[]>('/instructions'),
    createInstruction: (title: string, body: string, enabled = true) =>
      post<UserInstruction>('/instructions', { title, body, enabled }),
    updateInstruction: (
      id: number,
      data: Partial<Pick<UserInstruction, 'title' | 'body' | 'enabled'>>,
    ) => put<UserInstruction>(`/instructions/${id}`, data),
    deleteInstruction: (id: number) => del<unknown>(`/instructions/${id}`),

    // shared notes (Save to 2brn)
    ingestNote: (body: NoteIngestRequest) => post<NoteIngestResponse>('/ingest/note', body),
    listSharedNotes: (limit = 50) => get<SharedNote[]>(`/ingest/notes?limit=${limit}`),
    deleteSharedNote: (id: number) => del<{ ok: boolean }>(`/ingest/notes/${id}`),

    // streaming chat
    chatStream,
  }
}

export type ApiClient = ReturnType<typeof createHttpClient>
