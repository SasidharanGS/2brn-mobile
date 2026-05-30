import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'

import { Card } from '@/components/ui'
import { PRIMARY } from '@/theme/colors'

/** The "Ask 2brn" grounded-answer panel. Renders nothing until an ask is in flight or done. */
export function AnswerCard({
  asking,
  answer,
  isGenerating,
  downloadProgress,
}: {
  asking: boolean
  answer: string | null
  isGenerating: boolean
  downloadProgress: number
}) {
  if (!asking && !answer) return null
  return (
    <Card className="mb-3">
      <View className="mb-1 flex-row items-center">
        <Ionicons name="sparkles" size={14} color={PRIMARY} />
        <Text className="ml-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Answer
        </Text>
      </View>
      {asking ? (
        <Text className="text-sm text-slate-400 dark:text-slate-500">
          {isGenerating
            ? 'Thinking…'
            : `Loading the on-device model…${downloadProgress < 1 ? ` ${Math.round(downloadProgress * 100)}%` : ''}`}
        </Text>
      ) : (
        <View>
          <Text className="text-sm text-slate-800 dark:text-slate-200">{answer}</Text>
          <Text className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            Answered on-device from your notes below.
          </Text>
        </View>
      )}
    </Card>
  )
}
