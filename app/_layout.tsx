import '../global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@/api/queryClient'
import { ConnectionProvider } from '@/connection/ConnectionContext'
import { selfTest } from '@/db/local'

/** When Android delivers a share intent, jump to the compose/confirm screen. */
function ShareIntentGate() {
  const { hasShareIntent } = useShareIntentContext()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (hasShareIntent && pathname !== '/share') {
      router.replace('/share')
    }
  }, [hasShareIntent, pathname, router])

  return null
}

/** Phase 0, Step 1: dev-only on-device store sanity check (logs to Metro / logcat). */
function DbSelfTest() {
  useEffect(() => {
    if (!__DEV__) return
    selfTest()
      .then((r) => console.log(`[2brn-db-selftest] ok before=${r.before} after=${r.after}`))
      .catch((e) => console.log('[2brn-db-selftest] FAIL', e))
  }, [])
  return null
}

export default function RootLayout() {
  return (
    <ShareIntentProvider options={{ resetOnBackground: true, debug: false }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ConnectionProvider>
            <StatusBar style="auto" />
            <ShareIntentGate />
            <DbSelfTest />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="share" options={{ presentation: 'modal' }} />
            </Stack>
          </ConnectionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  )
}
