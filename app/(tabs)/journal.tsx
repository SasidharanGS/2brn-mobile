import { useState } from 'react'

import { DateBar } from '@/components/DateBar'
import { MarkdownDocView } from '@/components/MarkdownDocView'
import { Screen } from '@/components/Screen'
import { ScreenTitle } from '@/components/ui'
import { useMarkdownDoc } from '@/hooks/useMarkdownDoc'
import { todayISODate } from '@/utils/date'

export default function JournalScreen() {
  const [date, setDate] = useState(todayISODate())
  const { refreshing, onRefresh, docViewProps } = useMarkdownDoc('journal', date)

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle>Journal</ScreenTitle>
      <DateBar date={date} onChange={setDate} />
      <MarkdownDocView key={date} {...docViewProps} />
    </Screen>
  )
}
