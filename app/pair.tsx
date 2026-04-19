import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SegmentedControl } from '@/components/SegmentedControl'
import { Button, Card, ScreenTitle } from '@/components/ui'
import { useConnection } from '@/connection/ConnectionContext'
import { buildPairingUrl, parsePairingPayload, type PairingPayload } from '@/connection/pairing'

export default function PairScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { pair } = useConnection()
  const [permission, requestPermission] = useCameraPermissions()
  const [mode, setMode] = useState<'scan' | 'manual'>('scan')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState('http://')
  const [manualToken, setManualToken] = useState('')
  const handledRef = useRef(false)

  const attempt = useCallback(
    async (payload: PairingPayload) => {
      setBusy(true)
      setError(null)
      const check = await pair(payload)
      setBusy(false)
      if (check.ok) {
        router.replace('/')
      } else {
        setError(check.error ?? 'Pairing failed.')
        handledRef.current = false
      }
    },
    [pair, router],
  )

  const onScanned = useCallback(
    ({ data }: { data: string }) => {
      if (handledRef.current || busy) return
      const payload = parsePairingPayload(data)
      if (!payload) {
        setError("That QR code isn't a 2brn pairing code.")
        return
      }
      handledRef.current = true
      void attempt(payload)
    },
    [attempt, busy],
  )

  const onManualSubmit = () => {
    const payload = parsePairingPayload(buildPairingUrl(manualUrl.trim(), manualToken.trim()))
    if (!payload) {
      setError('Enter a valid http:// URL and the pairing token from your desktop.')
      return
    }
    void attempt(payload)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
      >
        <ScreenTitle subtitle="Open your desktop 2brn → Settings → Connect a phone, enable LAN access, then scan the QR code.">
          Connect a device
        </ScreenTitle>

        <SegmentedControl
          options={[
            { label: 'Scan QR', value: 'scan' },
            { label: 'Enter manually', value: 'manual' },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m)
            setError(null)
          }}
        />

        {mode === 'scan' ? (
          <Card className="overflow-hidden p-0">
            <View className="aspect-square w-full items-center justify-center bg-black">
              {!permission ? (
                <Text className="text-slate-300">Checking camera…</Text>
              ) : !permission.granted ? (
                <View className="items-center px-6">
                  <Text className="mb-4 text-center text-slate-300">
                    2brn needs camera access to scan the pairing QR code.
                  </Text>
                  <View className="w-48">
                    <Button label="Allow camera" onPress={requestPermission} />
                  </View>
                </View>
              ) : (
                <CameraView
                  style={{ flex: 1, width: '100%' }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={onScanned}
                />
              )}
            </View>
          </Card>
        ) : (
          <Card>
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Desktop URL
            </Text>
            <TextInput
              value={manualUrl}
              onChangeText={setManualUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="http://192.168.1.23:7842"
              placeholderTextColor="#94a3b8"
              className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pairing token
            </Text>
            <TextInput
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="Paste the token from the desktop"
              placeholderTextColor="#94a3b8"
              className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            <Button label="Connect" onPress={onManualSubmit} loading={busy} />
          </Card>
        )}

        {busy && mode === 'scan' ? (
          <Text className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">Connecting…</Text>
        ) : null}
        {error ? <Text className="mt-4 text-center text-sm text-red-500">{error}</Text> : null}

        <Text
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/memories'))}
          className="mt-6 text-center text-sm font-medium text-primary"
        >
          Skip — use 2brn on this phone
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
