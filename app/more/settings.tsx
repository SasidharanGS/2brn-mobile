import { useMutation, useQueryClient } from '@tanstack/react-query'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { Alert, Linking, Pressable, Switch, Text, View } from 'react-native'

import { queryKeys } from '@/api/queryKeys'
import { Header } from '@/components/Header'
import { QueryState } from '@/components/QueryState'
import { Screen } from '@/components/Screen'
import { Button, Card, SectionTitle } from '@/components/ui'
import { useApi, useConnection } from '@/connection/ConnectionContext'
import { useSettings } from '@/hooks/queries'
import { useTheme } from '@/theme/ThemeContext'
import { SKINS, THEME_MODES } from '@/theme/tokens'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="ml-3 flex-1 text-right text-sm text-fg" numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

/** Inline segmented control used for the appearance choices. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  const { skin, tokens } = useTheme()
  return (
    <View
      className="flex-row self-start overflow-hidden border border-border"
      style={{ borderRadius: skin === 'minimal' ? tokens.radiusPill : 10 }}
    >
      {options.map((opt, i) => {
        const active = opt === value
        const activeText = skin === 'minimal' ? tokens.colors.bg : '#ffffff'
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="px-3.5 py-1.5"
            style={{
              backgroundColor: active ? tokens.colors.accent : 'transparent',
              borderLeftWidth: i === 0 ? 0 : 1,
              borderLeftColor: tokens.colors.border,
            }}
          >
            <Text
              className="text-xs font-semibold capitalize"
              style={{ color: active ? activeText : tokens.colors.fg }}
            >
              {opt}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const api = useApi()
  const qc = useQueryClient()
  const { state, unpair } = useConnection()
  const settings = useSettings()
  const { skin, mode, setSkin, setMode } = useTheme()

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
    <View className="flex-1 bg-bg">
      <Header title="Settings" />
      <Screen
        scroll
        topInset={false}
        refreshing={settings.isRefetching}
        onRefresh={() => void settings.refetch()}
      >
        <SectionTitle>Appearance</SectionTitle>
        <Card className="mb-4">
          <View className="flex-row items-center justify-between py-1.5">
            <Text className="text-sm text-fg">Theme</Text>
            <Segmented value={skin} options={SKINS} onChange={setSkin} />
          </View>
          <View className="flex-row items-center justify-between py-1.5">
            <Text className="text-sm text-fg">Mode</Text>
            <Segmented value={mode} options={THEME_MODES} onChange={setMode} />
          </View>
        </Card>

        <SectionTitle>Connection</SectionTitle>
        <Card className="mb-4">
          <Row label="Desktop" value={state.status === 'paired' ? state.baseUrl : '—'} />
          {state.status === 'paired' && state.version ? (
            <Row label="Daemon" value={state.version} />
          ) : null}
          {state.status === 'paired' && state.mock ? (
            <Row label="Mode" value="Mock (demo data)" />
          ) : null}
          <View className="mt-3">
            <Button label="Disconnect" variant="danger" onPress={onUnpair} />
          </View>
        </Card>

        <QueryState query={settings}>
          {(data) => (
            <>
              <SectionTitle>Capture</SectionTitle>
              <Card className="mb-4">
                <View className="flex-row items-center justify-between py-1">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm text-fg">Pause capture</Text>
                    <Text className="text-xs text-muted">
                      Stops the desktop from taking new screenshots.
                    </Text>
                  </View>
                  <Switch
                    value={data.paused}
                    onValueChange={(v) => setPaused.mutate(v)}
                    disabled={setPaused.isPending}
                  />
                </View>
                <Row label="Interval" value={`${data.capture_interval_seconds}s`} />
                <Row label="Encryption" value={data.screenshot_encryption_enabled ? 'On' : 'Off'} />
              </Card>

              <SectionTitle>AI providers (edit on desktop)</SectionTitle>
              <Card className="mb-4">
                <Row label="Chat model" value={data.chat_provider.model || '—'} />
                <Row label="Chat endpoint" value={data.chat_provider.base_url || '—'} />
                <Row label="Embed model" value={data.embed_provider.model || '—'} />
                <Text className="mt-2 text-xs text-muted">
                  Provider URLs and API keys are managed on the desktop app to keep secrets off your
                  phone.
                </Text>
              </Card>
            </>
          )}
        </QueryState>

        <SectionTitle>About</SectionTitle>
        <Card>
          <Row label="App version" value={Constants.expoConfig?.version ?? '0.1.0'} />
          <Text className="mt-2 text-sm text-muted">
            2brn keeps your captures on your phone — embedded, searchable, and answered on-device. A
            desktop is optional; when paired it syncs over your local network, and nothing leaves
            it.
          </Text>
          <Text
            accessibilityRole="link"
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
              <Text className="mb-2 text-sm text-muted">
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
