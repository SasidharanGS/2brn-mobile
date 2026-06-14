import { useState } from 'react'
import { View } from 'react-native'

import { DateBar } from '@/components/DateBar'
import { Header } from '@/components/Header'
import { MarkdownDocView } from '@/components/MarkdownDocView'
import { Screen } from '@/components/Screen'
import { useMarkdownDoc } from '@/hooks/useMarkdownDoc'
import { todayISODate } from '@/utils/date'

export default function BlogScreen() {
  const [date, setDate] = useState(todayISODate())
  const { refreshing, onRefresh, docViewProps } = useMarkdownDoc('blog', date)

  return (
    <View className="flex-1 bg-bg">
      <Header title="Blog" />
      <Screen scroll topInset={false} refreshing={refreshing} onRefresh={onRefresh}>
        <DateBar date={date} onChange={setDate} />
        <MarkdownDocView key={date} {...docViewProps} />
      </Screen>
    </View>
  )
}
