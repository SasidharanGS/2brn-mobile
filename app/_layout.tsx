import '../global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent'
import { useEffect } from 'react'
import { initExecutorch } from 'react-native-executorch'
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@/api/queryClient'
import { ConnectionProvider } from '@/connection/ConnectionContext'
import { EmbeddingsProvider } from '@/ml/EmbeddingsContext'
import { LlmProvider } from '@/ml/LlmContext'
import { OcrProvider } from '@/ml/OcrContext'
import { SttProvider } from '@/ml/SttContext'

// Wire ExecuTorch's on-device model runtime to Expo's file system (once, at startup).
initExecutorch({ resourceFetcher: ExpoResourceFetcher })

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

export default function RootLayout() {
  return (
    <ShareIntentProvider options={{ resetOnBackground: true, debug: false }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ConnectionProvider>
            <EmbeddingsProvider>
              <OcrProvider>
                <SttProvider>
                  <LlmProvider>
                    <StatusBar style="auto" />
                    <ShareIntentGate />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: 'transparent' },
                      }}
                    >
                      <Stack.Screen name="share" options={{ presentation: 'modal' }} />
                    </Stack>
                  </LlmProvider>
                </SttProvider>
              </OcrProvider>
            </EmbeddingsProvider>
          </ConnectionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  )
}
