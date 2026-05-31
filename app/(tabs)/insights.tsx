import { useState } from 'react'
import { Text, View } from 'react-native'

import type { InsightsPeriod } from '@/api/types'
import { QueryState } from '@/components/QueryState'
import { Screen } from '@/components/Screen'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Card, CategoryChip, ScreenTitle, SectionTitle, Stat, StateChip } from '@/components/ui'
import { useInsightsSummary } from '@/hooks/queries'
import { categoryChip, PRIMARY, stateChip } from '@/theme/colors'
import { todayISODate } from '@/utils/date'

function Meter({ pct, color }: { pct: number; color: string }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <View
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: color }}
        className="h-2 rounded-full"
      />
    </View>
  )
}

export default function InsightsScreen() {
  const [period, setPeriod] = useState<InsightsPeriod>('day')
  const date = todayISODate()
  const q = useInsightsSummary(date, period)

  return (
    <Screen scroll refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <ScreenTitle>Insights</ScreenTitle>
      <SegmentedControl
        options={[
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <QueryState query={q}>
        {(data) => (
          <View>
            <Card className="mb-4">
              <View className="flex-row">
                <Stat label="captures" value={data.total_captures.toLocaleString()} />
                <Stat
                  label="active vs avg"
                  value={`${data.comparison.active.current_pct}%`}
                  hint={`base ${data.comparison.active.baseline_pct}%`}
                />
                <Stat
                  label="distracted"
                  value={`${data.comparison.distracted.current_pct}%`}
                  hint={`base ${data.comparison.distracted.baseline_pct}%`}
                />
              </View>
            </Card>

            {data.categories.length > 0 ? (
              <View className="mb-4">
                <SectionTitle>Categories</SectionTitle>
                <Card>
                  {data.categories.map((c) => (
                    <View key={c.task_category} className="mb-3">
                      <View className="mb-1 flex-row items-center justify-between">
                        <CategoryChip category={c.task_category} />
                        <Text className="text-xs text-slate-500 dark:text-slate-400">{c.pct}%</Text>
                      </View>
                      <Meter pct={c.pct} color={categoryChip(c.task_category).dot} />
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}

            {data.productivity_states.length > 0 ? (
              <View className="mb-4">
                <SectionTitle>Productivity</SectionTitle>
                <Card>
                  {data.productivity_states.map((s) => (
                    <View key={s.productivity_state} className="mb-3">
                      <View className="mb-1 flex-row items-center justify-between">
                        <StateChip state={s.productivity_state} />
                        <Text className="text-xs text-slate-500 dark:text-slate-400">{s.pct}%</Text>
                      </View>
                      <Meter pct={s.pct} color={stateChip(s.productivity_state).dot} />
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}

            {data.top_apps.length > 0 ? (
              <View className="mb-4">
                <SectionTitle>Top apps</SectionTitle>
                <Card>
                  {data.top_apps.map((a) => (
                    <View key={a.app_name} className="mb-3">
                      <View className="mb-1 flex-row items-center justify-between">
                        <Text className="text-sm text-slate-700 dark:text-slate-200">
                          {a.app_name}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">{a.pct}%</Text>
                      </View>
                      <Meter pct={a.pct} color={PRIMARY} />
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}

            {data.recurring_activities.length > 0 ? (
              <View className="mb-4">
                <SectionTitle>Recurring</SectionTitle>
                <Card>
                  {data.recurring_activities.map((r, i) => (
                    <View
                      key={r.canonical_summary}
                      className={
                        i > 0 ? 'mt-3 border-t border-slate-100 pt-3 dark:border-slate-800' : ''
                      }
                    >
                      <Text className="text-sm text-slate-800 dark:text-slate-100">
                        {r.canonical_summary}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {r.pct}% · {r.session_count} sessions
                      </Text>
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}
          </View>
        )}
      </QueryState>
    </Screen>
  )
}
