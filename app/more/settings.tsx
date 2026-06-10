import { useMutation, useQueryClient } from '@tanstack/react-query'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { Alert, Linking, Switch, Text, View } from 'react-native'

import { queryKeys } from '@/api/queryKeys'
import { Header } from '@/components/Header'
import { Screen } from '@/components/Screen'
import { ErrorState, Loading } from '@/components/states'
import { Button, Card, SectionTitle } from '@/components/ui'
import { useApi, useConnection } from '@/connection/ConnectionContext'
import { useSettings } from '@/hooks/queries'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className="ml-3 flex-1 text-right text-sm text-slate-900 dark:text-slate-100" numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const api = useApi()
  const qc = useQueryClient()
  const { state, unpair } = useConnection()
  const settings = useSettings()

  const setPaused = useMutation({
    mutationFn: (paused: boolean) => api.setPaused(paused),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.settings })
      void qc.invalidateQueries({ queryKey: queryKeys.status })
    },
  })

  const onUnpair = () =>
    Alert.alert('Disconnect this device?', "You'll need to scan the QR code again to reconnect.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await unpair()
          router.replace('/memories')
        },
      },
    ])

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Settings" />
      <Screen scroll topInset={false} refreshing={settings.isRefetching} onRefresh={() => void settings.refetch()}>
        <SectionTitle>Connection</SectionTitle>
        <Card className="mb-4">
          <Row label="Desktop" value={state.status === 'paired' ? state.baseUrl : '—'} />
          {state.status === 'paired' && state.version ? <Row label="Daemon" value={state.version} /> : null}
          {state.status === 'paired' && state.mock ? <Row label="Mode" value="Mock (demo data)" /> : null}
          <View className="mt-3">
            <Button label="Disconnect" variant="danger" onPress={onUnpair} />
          </View>
        </Card>

        {settings.isLoading ? (
          <Loading />
        ) : settings.error ? (
          <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
        ) : settings.data ? (
          <>
            <SectionTitle>Capture</SectionTitle>
            <Card className="mb-4">
              <View className="flex-row items-center justify-between py-1">
                <View className="flex-1 pr-3">
                  <Text className="text-sm text-slate-900 dark:text-slate-100">Pause capture</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Stops the desktop from taking new screenshots.
                  </Text>
                </View>
                <Switch
                  value={settings.data.paused}
                  onValueChange={(v) => setPaused.mutate(v)}
                  disabled={setPaused.isPending}
                />
              </View>
              <Row label="Interval" value={`${settings.data.capture_interval_seconds}s`} />
              <Row label="Encryption" value={settings.data.screenshot_encryption_enabled ? 'On' : 'Off'} />
            </Card>

            <SectionTitle>AI providers (edit on desktop)</SectionTitle>
            <Card className="mb-4">
              <Row label="Chat model" value={settings.data.chat_provider.model || '—'} />
              <Row label="Chat endpoint" value={settings.data.chat_provider.base_url || '—'} />
              <Row label="Embed model" value={settings.data.embed_provider.model || '—'} />
              <Text className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Provider URLs and API keys are managed on the desktop app to keep secrets off your phone.
              </Text>
            </Card>
          </>
        ) : null}

        <SectionTitle>About</SectionTitle>
        <Card>
          <Row label="App version" value={Constants.expoConfig?.version ?? '0.1.0'} />
          <Text className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            2brn keeps your captures on your phone — embedded, searchable, and answered on-device. A desktop is
            optional; when paired it syncs over your local network, and nothing leaves it.
          </Text>
          <Text
            onPress={() => void Linking.openURL('https://github.com/SasidharanGS/2brn')}
            className="mt-2 text-sm text-primary"
          >
            github.com/SasidharanGS/2brn
          </Text>
        </Card>

        {__DEV__ ? (
          <>
            <SectionTitle>Developer</SectionTitle>
            <Card>
              <Text className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                Verify the on-device models run on this device.
              </Text>
              <Button
                label="On-device model smoke test"
                variant="secondary"
                onPress={() => router.push('/dev/smoke')}
              />
            </Card>
          </>
        ) : null}
      </Screen>
    </View>
  )
}
