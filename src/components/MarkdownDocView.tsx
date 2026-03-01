import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'

import { prettyTime } from '@/utils/date'
import { Markdown } from './Markdown'
import { EmptyState, ErrorState, Loading } from './states'
import { Button, Card } from './ui'

interface Props {
  content: string | null
  generatedAt?: string | null
  editedByUser?: boolean
  loading: boolean
  error: unknown
  generating: boolean
  saving: boolean
  onRetry: () => void
  onGenerate: () => void
  onSave: (text: string) => void
  emptyTitle: string
  emptyMessage: string
  generateLabel: string
}

/** Shared view for a date-scoped markdown document (journal / blog): renders the
 *  content with Edit + Regenerate, an empty/generate state, and loading/errors. */
export function MarkdownDocView(props: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (props.loading) return <Loading />
  if (props.error) return <ErrorState error={props.error} onRetry={props.onRetry} />

  if (!props.content) {
    return (
      <View>
        <EmptyState title={props.emptyTitle} message={props.emptyMessage} icon="✨" />
        <Button
          label={props.generating ? 'Generating…' : props.generateLabel}
          loading={props.generating}
          onPress={props.onGenerate}
        />
      </View>
    )
  }

  if (editing) {
    return (
      <View>
        <TextInput
          multiline
          value={draft}
          onChangeText={setDraft}
          textAlignVertical="top"
          className="min-h-[320px] rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
          </View>
          <View className="flex-1">
            <Button
              label="Save"
              loading={props.saving}
              onPress={() => {
                props.onSave(draft)
                setEditing(false)
              }}
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View>
      <Card>
        <Markdown>{props.content}</Markdown>
      </Card>
      <Text className="mt-2 px-1 text-xs text-slate-400 dark:text-slate-500">
        {props.editedByUser
          ? 'Edited by you'
          : props.generatedAt
            ? `Generated ${prettyTime(props.generatedAt)}`
            : ''}
      </Text>
      <View className="mt-3 flex-row gap-3">
        <View className="flex-1">
          <Button
            label="Edit"
            variant="secondary"
            onPress={() => {
              setDraft(props.content ?? '')
              setEditing(true)
            }}
          />
        </View>
        <View className="flex-1">
          <Button
            label={props.generating ? 'Regenerating…' : 'Regenerate'}
            loading={props.generating}
            onPress={props.onGenerate}
          />
        </View>
      </View>
    </View>
  )
}
