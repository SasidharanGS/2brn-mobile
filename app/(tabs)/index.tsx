import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { QueryState } from '@/components/QueryState'
import { Screen } from '@/components/Screen'
import { Card, CategoryChip, ScreenTitle, SectionTitle, Stat } from '@/components/ui'
import { useConnection } from '@/connection/ConnectionContext'
import { useInsightsSummary, useStatus } from '@/hooks/queries'
import { useTheme } from '@/theme/ThemeContext'
import { prettyTime, todayISODate } from '@/utils/date'

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
}) {
  const { skin, tokens } = useTheme()
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        className="flex-1 items-center rounded-2xl border border-border bg-surface py-4 active:opacity-70"
        style={skin === 'minimal' ? { borderRadius: tokens.radiusCard } : undefined}
      >
        <Ionicons name={icon} size={22} color={tokens.colors.accent} />
        <Text className="mt-1.5 text-xs font-medium text-fg">{label}</Text>
      </Pressable>
    </Link>
  )
}

export default function Home() {
  const today = todayISODate()
  const { state } = useConnection()
  const status = useStatus()
  const insights = useInsightsSummary(today, 'day')

  const onRefresh = () => {
    void status.refetch()
    void insights.refetch()
  }

  return (
    <Screen scroll refreshing={status.isRefetching || insights.isRefetching} onRefresh={onRefresh}>
      <ScreenTitle
        subtitle={
          state.status === 'paired' && state.mock
            ? 'Demo data (mock mode)'
            : 'Your second brain, today'
        }
      >
        2brn
      </ScreenTitle>

      <QueryState query={status}>
        {(data) => (
          <Card className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className={`mr-2 h-2.5 w-2.5 rounded-full ${data.status === 'capturing' ? 'bg-emerald-500' : data.status === 'paused' ? 'bg-amber-500' : 'bg-red-500'}`}
                />
                <Text className="font-semibold capitalize text-fg">{data.status}</Text>
              </View>
              <Text className="text-xs text-muted">
                {data.last_captured_at
                  ? `Last capture ${prettyTime(data.last_captured_at)}`
                  : 'No captures yet'}
              </Text>
            </View>
            <View className="mt-4 flex-row">
              <Stat label="captures today" value={String(data.capture_count_today)} />
              <Stat label="daemon" value={data.daemon_version} />
            </View>
          </Card>
        )}
      </QueryState>

      <QueryState
        query={insights}
        loading={null}
        isEmpty={(data) => data.categories.length === 0}
        empty={null}
        errorFallback={
          <Text className="mb-4 text-xs text-muted">Couldn&apos;t load today&apos;s mix.</Text>
        }
      >
        {(data) => (
          <View className="mb-4">
            <SectionTitle>Today&apos;s mix</SectionTitle>
            <Card>
              <View className="flex-row flex-wrap gap-2">
                {data.categories.slice(0, 5).map((c) => (
                  <View key={c.task_category} className="flex-row items-center">
                    <CategoryChip category={c.task_category} />
                    <Text className="ml-1 text-xs text-muted">{c.pct}%</Text>
                  </View>
                ))}
              </View>
              <View className="mt-4 flex-row">
                <Stat
                  label="active vs avg"
                  value={`${data.comparison.active.current_pct}%`}
                  hint={`base ${data.comparison.active.baseline_pct}%`}
                />
                <Stat
                  label="productive"
                  value={`${data.comparison.productive.current_pct}%`}
                  hint={`base ${data.comparison.productive.baseline_pct}%`}
                />
                <Stat
                  label="distracted"
                  value={`${data.comparison.distracted.current_pct}%`}
                  hint={`base ${data.comparison.distracted.baseline_pct}%`}
                />
              </View>
            </Card>
          </View>
        )}
      </QueryState>

      <SectionTitle>Quick actions</SectionTitle>
      <View className="flex-row gap-3">
        <QuickAction href="/chat" icon="chatbubble-ellipses-outline" label="Ask your brain" />
        <QuickAction href="/insights" icon="stats-chart-outline" label="Insights" />
        <QuickAction href="/more/saved" icon="bookmark-outline" label="Saved" />
      </View>
    </Screen>
  )
}
