import '../global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
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
import { ThemeProvider } from '@/theme/ThemeContext'

// Wire ExecuTorch's on-device model runtime to Expo's file system. Done from the
// root layout's mount effect (not as an import-time side effect) so importing this
// module in tests doesn't touch the native runtime. The guard keeps it once-only
// across re-renders and StrictMode's double-invoke in dev.
let executorchWired = false
function wireExecutorch() {
  if (executorchWired) return
  executorchWired = true
  initExecutorch({ resourceFetcher: ExpoResourceFetcher })
}

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
  // Inter (variable) powers the minimal skin; modern uses the system font. We
  // proceed on load error too — Inter just falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    Inter: require('../assets/fonts/Inter-Variable.ttf'),
  })

  useEffect(() => {
    wireExecutorch()
  }, [])

  if (!fontsLoaded && !fontError) return null

  return (
    <ShareIntentProvider options={{ resetOnBackground: true, debug: false }}>
      <SafeAreaProvider>
        <ThemeProvider>
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
        </ThemeProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  )
}
