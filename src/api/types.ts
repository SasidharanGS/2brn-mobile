// API contract shared with the 2brn daemon. Ported from the desktop UI
// (ui/src/api/types.ts) so the mobile client speaks exactly the same protocol,
// plus the mobile-specific additions (connection-info, ingest/shared notes).

export interface DaemonStatus {
  status: 'capturing' | 'paused' | 'error'
  capture_count_today: number
  last_captured_at: string | null
  daemon_version: string
}

export interface CaptureRecord {
  id: number
  captured_at: string
  app_name: string | null
  window_title: string | null
  file_path: string | null
  trigger: string | null
  monitor_index: number | null
}

export interface ActivityRecord {
  id: number
  capture_id: number | null
  started_at: string
  ended_at: string | null
  summary: string | null
  tags: string | null
  task_category: string | null
  task_category_confidence: number | null
  productivity_state: string | null
  productivity_confidence: number | null
  category_overridden_by_user: boolean
}

export interface JournalEntry {
  date: string
  content: string | null
  generated_at: string | null
  edited_by_user: boolean
}

export interface BlogPost {
  date: string
  content: string | null
  generated_at: string | null
  edited_by_user: boolean
}

export interface DailyInsights {
  date: string
  categories: { task_category: string; count: number; avg_confidence: number }[]
  productivity_states: { productivity_state: string; count: number }[]
  top_apps: { app_name: string; count: number }[]
}

// ── Insights summary (Day / Week / Month) ─────────────────────────────────────

export type InsightsPeriod = 'day' | 'week' | 'month'

export interface InsightsCategoryBucket {
  task_category: string
  count: number
  pct: number
  avg_confidence: number
}

export interface InsightsStateBucket {
  productivity_state: string
  count: number
  pct: number
}

export interface InsightsAppBucket {
  app_name: string
  count: number
  pct: number
}

export interface HeatmapCell {
  hour: number // 0–23
  pct: number
  dominant_state: string | null
  by_state_pct: Record<string, number>
}

export interface ComparisonMetric {
  current_pct: number
  baseline_pct: number
}

export interface InsightsComparison {
  baseline_label: string // "7-day average" | "4-week average" | "3-month average"
  active: ComparisonMetric
  productive: ComparisonMetric
  distracted: ComparisonMetric
}

export interface RecurringActivity {
  canonical_summary: string
  pct: number
  session_count: number
  variant_count: number
}

export interface InsightsSummary {
  period: InsightsPeriod
  date: string
  range: { start: string; end: string; span_days: number }
  total_captures: number
  categories: InsightsCategoryBucket[]
  productivity_states: InsightsStateBucket[]
  top_apps: InsightsAppBucket[]
  hourly_heatmap: HeatmapCell[]
  comparison: InsightsComparison
  recurring_activities: RecurringActivity[]
}

export interface ProviderConfig {
  type: string
  base_url: string
  model: string
  extra_headers?: Record<string, string>
}

export interface ScheduleConfig {
  hour: number
  minute: number
}

export interface BlogScheduleConfig {
  frequency: 'daily' | 'monthly' | 'weekly'
  hour: number
  minute: number
  day: number
  days_of_week: string[]
}

export interface AppSettings {
  chat_provider: ProviderConfig
  embed_provider: ProviderConfig
  has_chat_key: boolean
  has_embed_key: boolean
  capture_interval_seconds: number
  purge_months: number
  paused: boolean
  lan_access: boolean
  screenshot_encryption_enabled: boolean
  joplin_enabled: boolean
  joplin_db_path: string
  journal_schedule: ScheduleConfig
  blog_schedule: BlogScheduleConfig
}

export interface UserInstruction {
  id: number
  title: string
  body: string
  enabled: boolean
  created_at: string
}

// ── Mobile-specific: connection-info + ingest (shared notes) ──────────────────

export interface ConnectionInfo {
  hostname: string
  port: number
  lan_access: boolean
  lan_urls: string[]
}

export interface SharedNote {
  id: number
  title: string | null
  text: string
  source_url: string | null
  tags: string | null
  source: string
  embedded: boolean
  created_at: string
}

export interface NoteIngestRequest {
  text: string
  title?: string
  source_url?: string
  tags?: string
}

export interface NoteIngestResponse {
  ok: boolean
  id: number
  embedded: boolean
}

// Task categories and productivity states the daemon emits (for chips/colors).
export const TASK_CATEGORIES = [
  'work',
  'research',
  'play',
  'learning',
  'communication',
  'creative',
  'admin',
  'other',
] as const
export type TaskCategory = (typeof TASK_CATEGORIES)[number]

export const PRODUCTIVITY_STATES = [
  'productive',
  'focused',
  'chilling',
  'procrastinating',
  'distracted',
  'in-meeting',
  'idle',
] as const
export type ProductivityState = (typeof PRODUCTIVITY_STATES)[number]
