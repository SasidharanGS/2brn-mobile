// In-memory mock implementing the ApiClient shape. Backs the app with realistic
// fixture data so every screen can be exercised with no daemon and no device —
// used by `EXPO_PUBLIC_MOCK=1`, `npm run web`, and the test suite.

import type { ApiClient } from './client'
import { todayISODate } from '@/utils/date'
import type {
  ActivityRecord,
  AppSettings,
  BlogPost,
  CaptureRecord,
  DailyInsights,
  InsightsPeriod,
  InsightsSummary,
  JournalEntry,
  SharedNote,
  UserInstruction,
} from './types'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const SAMPLE_ACTIVITIES: ActivityRecord[] = [
  {
    id: 1,
    capture_id: 1,
    started_at: `${todayISODate()}T09:12:00`,
    ended_at: null,
    summary: 'Reviewing a pull request for the daemon auth middleware',
    tags: 'code-review,github',
    task_category: 'work',
    task_category_confidence: 0.93,
    productivity_state: 'focused',
    productivity_confidence: 0.88,
    category_overridden_by_user: false,
  },
  {
    id: 2,
    capture_id: 2,
    started_at: `${todayISODate()}T10:40:00`,
    ended_at: null,
    summary: 'Reading the RAG retrieval paper and taking notes',
    tags: 'research,reading',
    task_category: 'research',
    task_category_confidence: 0.81,
    productivity_state: 'productive',
    productivity_confidence: 0.79,
    category_overridden_by_user: false,
  },
  {
    id: 3,
    capture_id: 3,
    started_at: `${todayISODate()}T13:05:00`,
    ended_at: null,
    summary: 'Scrolling a social feed during lunch',
    tags: 'break',
    task_category: 'play',
    task_category_confidence: 0.7,
    productivity_state: 'chilling',
    productivity_confidence: 0.74,
    category_overridden_by_user: false,
  },
  {
    id: 4,
    capture_id: 4,
    started_at: `${todayISODate()}T15:20:00`,
    ended_at: null,
    summary: 'Standup and sprint planning call',
    tags: 'meeting',
    task_category: 'communication',
    task_category_confidence: 0.9,
    productivity_state: 'in-meeting',
    productivity_confidence: 0.92,
    category_overridden_by_user: false,
  },
]

const JOURNAL_MD = `## Your day

You started with a focused stretch reviewing the **daemon auth middleware** PR,
then shifted into research — reading the RAG retrieval paper and taking notes.

After a short break around lunch, the afternoon was anchored by **sprint planning**.

> A productive, work-leaning day with one solid research block.`

const BLOG_MD = `# Building a second brain, one capture at a time

Today's theme was *trust the pipeline*. The morning's PR review tightened the
auth story, and the RAG paper gave me a few ideas for better retrieval…`

function buildInsightsSummary(date: string, period: InsightsPeriod): InsightsSummary {
  const span = period === 'day' ? 1 : period === 'week' ? 7 : 30
  return {
    period,
    date,
    range: { start: date, end: date, span_days: span },
    total_captures: 142 * span,
    categories: [
      { task_category: 'work', count: 70, pct: 49, avg_confidence: 0.9 },
      { task_category: 'research', count: 35, pct: 25, avg_confidence: 0.82 },
      { task_category: 'communication', count: 22, pct: 15, avg_confidence: 0.88 },
      { task_category: 'play', count: 15, pct: 11, avg_confidence: 0.71 },
    ],
    productivity_states: [
      { productivity_state: 'focused', count: 60, pct: 42 },
      { productivity_state: 'productive', count: 40, pct: 28 },
      { productivity_state: 'in-meeting', count: 22, pct: 16 },
      { productivity_state: 'chilling', count: 12, pct: 8 },
      { productivity_state: 'distracted', count: 8, pct: 6 },
    ],
    top_apps: [
      { app_name: 'VS Code', count: 58, pct: 41 },
      { app_name: 'Chrome', count: 40, pct: 28 },
      { app_name: 'Slack', count: 24, pct: 17 },
      { app_name: 'Zoom', count: 20, pct: 14 },
    ],
    hourly_heatmap: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      pct: hour >= 8 && hour <= 18 ? Math.round(40 + 50 * Math.random()) : 0,
      dominant_state: hour >= 8 && hour <= 18 ? 'focused' : null,
      by_state_pct: (hour >= 8 && hour <= 18 ? { focused: 60, productive: 40 } : {}) as Record<
        string,
        number
      >,
    })),
    comparison: {
      baseline_label: period === 'day' ? '7-day average' : period === 'week' ? '4-week average' : '3-month average',
      active: { current_pct: 78, baseline_pct: 72 },
      productive: { current_pct: 70, baseline_pct: 65 },
      distracted: { current_pct: 6, baseline_pct: 11 },
    },
    recurring_activities: [
      { canonical_summary: 'Reviewing pull requests', pct: 18, session_count: 9, variant_count: 4 },
      { canonical_summary: 'Reading research papers', pct: 12, session_count: 6, variant_count: 3 },
    ],
  }
}

/** Build a mock client; optional overrides let tests swap individual methods. */
export function createMockClient(overrides: Partial<ApiClient> = {}): ApiClient {
  let instructions: UserInstruction[] = [
    {
      id: 1,
      title: 'Tone',
      body: 'Keep journal entries concise and in the first person.',
      enabled: true,
      created_at: `${todayISODate()}T08:00:00`,
    },
  ]
  let nextInstructionId = 2

  let sharedNotes: SharedNote[] = [
    {
      id: 1,
      title: 'Retrieval-Augmented Generation',
      text: 'Combine a retriever with a generator to ground answers in your own data.',
      source_url: 'https://example.com/rag',
      tags: 'ml,reading',
      source: 'mobile-share',
      embedded: true,
      created_at: `${todayISODate()}T11:30:00`,
    },
  ]
  let nextNoteId = 2

  const base: ApiClient = {
    getStatus: async () => ({
      status: 'capturing',
      capture_count_today: 142,
      last_captured_at: `${todayISODate()}T15:59:00`,
      daemon_version: '0.1.0 (mock)',
    }),
    getConnectionInfo: async () => ({
      hostname: 'mock-desktop.local',
      port: 7842,
      lan_access: true,
      lan_urls: ['http://192.168.1.23:7842'],
    }),
    getActivities: async (params) => {
      if (params.task_category) {
        return SAMPLE_ACTIVITIES.filter((a) => a.task_category === params.task_category)
      }
      if (params.productivity_state) {
        return SAMPLE_ACTIVITIES.filter((a) => a.productivity_state === params.productivity_state)
      }
      return SAMPLE_ACTIVITIES
    },
    getCaptures: async (date): Promise<CaptureRecord[]> =>
      SAMPLE_ACTIVITIES.map((a) => ({
        id: a.id,
        captured_at: a.started_at,
        app_name: a.task_category === 'work' ? 'VS Code' : a.task_category === 'communication' ? 'Zoom' : 'Chrome',
        window_title: a.summary,
        file_path: null,
        trigger: 'heartbeat',
        monitor_index: 0,
      })),
    overrideActivity: async (id, task_category, productivity_state) => {
      const a = SAMPLE_ACTIVITIES.find((x) => x.id === id) ?? SAMPLE_ACTIVITIES[0]
      return { ...a, task_category, productivity_state, category_overridden_by_user: true }
    },
    getJournal: async (date): Promise<JournalEntry | null> => ({
      date,
      content: JOURNAL_MD,
      generated_at: `${date}T21:00:00`,
      edited_by_user: false,
    }),
    generateJournal: async () => ({ ok: true }),
    updateJournal: async () => ({ ok: true }),
    getBlogPost: async (date): Promise<BlogPost | null> => ({
      date,
      content: BLOG_MD,
      generated_at: `${date}T21:05:00`,
      edited_by_user: false,
    }),
    generateBlogPost: async () => ({ ok: true, generated: true }),
    updateBlogPost: async () => ({ ok: true }),
    getDailyInsights: async (date): Promise<DailyInsights> => ({
      date,
      categories: [
        { task_category: 'work', count: 70, avg_confidence: 0.9 },
        { task_category: 'research', count: 35, avg_confidence: 0.82 },
      ],
      productivity_states: [
        { productivity_state: 'focused', count: 60 },
        { productivity_state: 'productive', count: 40 },
      ],
      top_apps: [
        { app_name: 'VS Code', count: 58 },
        { app_name: 'Chrome', count: 40 },
      ],
    }),
    getInsightsSummary: async (date, period = 'day') => buildInsightsSummary(date, period),
    getSettings: async (): Promise<AppSettings> => ({
      chat_provider: { type: 'openai_compatible', base_url: 'http://localhost:11434/v1', model: 'llama3.1' },
      embed_provider: { type: 'custom', base_url: 'http://localhost:11434/v1', model: 'nomic-embed-text' },
      has_chat_key: true,
      has_embed_key: true,
      capture_interval_seconds: 60,
      purge_months: 12,
      paused: false,
      lan_access: true,
      screenshot_encryption_enabled: true,
      joplin_enabled: false,
      joplin_db_path: '',
      journal_schedule: { hour: 21, minute: 0 },
      blog_schedule: { frequency: 'daily', hour: 21, minute: 0, day: 1, days_of_week: [] },
    }),
    setPaused: async (paused) => ({ ok: true, paused }),
    listInstructions: async () => instructions,
    createInstruction: async (title, body, enabled = true) => {
      const inst: UserInstruction = {
        id: nextInstructionId++,
        title,
        body,
        enabled,
        created_at: new Date().toISOString(),
      }
      instructions = [...instructions, inst]
      return inst
    },
    updateInstruction: async (id, data) => {
      instructions = instructions.map((i) => (i.id === id ? { ...i, ...data } : i))
      return instructions.find((i) => i.id === id)!
    },
    deleteInstruction: async (id) => {
      instructions = instructions.filter((i) => i.id !== id)
      return undefined
    },
    ingestNote: async (body) => {
      const note: SharedNote = {
        id: nextNoteId++,
        title: body.title ?? null,
        text: body.text,
        source_url: body.source_url ?? null,
        tags: body.tags ?? null,
        source: 'mobile-share',
        embedded: true,
        created_at: new Date().toISOString(),
      }
      sharedNotes = [note, ...sharedNotes]
      return { ok: true, id: note.id, embedded: true }
    },
    listSharedNotes: async () => sharedNotes,
    deleteSharedNote: async (id) => {
      sharedNotes = sharedNotes.filter((n) => n.id !== id)
      return { ok: true }
    },
    chatStream: async function* (opts) {
      const answer =
        `Looking at ${opts.dateFilter ?? 'your recent activity'}, you spent most of your time on ` +
        `focused work — notably reviewing the auth middleware PR — with a solid research block ` +
        `reading the RAG paper. Want me to summarize the research notes?`
      for (const word of answer.split(' ')) {
        await delay(30)
        yield word + ' '
      }
    },
  }

  return { ...base, ...overrides }
}
