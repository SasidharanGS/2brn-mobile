import { Pressable, Text, View } from 'react-native'

import { addDays, isToday, relativeDay, todayISODate } from '@/utils/date'

/** Prev / label / next date navigator. Won't advance past today (date is clamped ≤ today). */
export function DateBar({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const nextDisabled = isToday(date)
  return (
    <View className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-1 py-1 dark:border-slate-800 dark:bg-slate-900">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous day"
        onPress={() => onChange(addDays(date, -1))}
        className="px-4 py-2"
      >
        <Text className="text-xl text-slate-600 dark:text-slate-300">‹</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Jump to today"
        onPress={() => onChange(todayISODate())}
        className="flex-1 items-center py-2"
      >
        <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {relativeDay(date)}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next day"
        disabled={nextDisabled}
        onPress={() => onChange(addDays(date, 1))}
        className={`px-4 py-2 ${nextDisabled ? 'opacity-30' : ''}`}
      >
        <Text className="text-xl text-slate-600 dark:text-slate-300">›</Text>
      </Pressable>
    </View>
  )
}
