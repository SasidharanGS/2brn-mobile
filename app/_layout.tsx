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
import { deleteMemory, getAllMemories, insertMemory } from '@/db/local'
import { EmbeddingsProvider, useEmbeddings } from '@/ml/EmbeddingsContext'

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

/** Phase 0 (Steps 1–3): dev-only end-to-end check — embed a sentence, store it with
 *  its vector, read it back, then clean up. Logs to Metro / logcat once the model loads. */
function PipelineSelfTest() {
  const { embed, isReady } = useEmbeddings()
  useEffect(() => {
    if (!isReady) return
    void (async () => {
      try {
        const vec = await embed('pipeline self-test')
        const id = await insertMemory({ text: 'pipeline self-test', source: 'selftest', embedding: vec })
        const rows = await getAllMemories()
        const storedDim = rows.find((r) => r.id === id)?.embedding?.length ?? 0
        console.log(`[2brn-pipeline-selftest] embedDim=${vec.length} storedDim=${storedDim} rows=${rows.length}`)
        await deleteMemory(id)
      } catch (e) {
        console.log('[2brn-pipeline-selftest] FAIL', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])
  return null
}

export default function RootLayout() {
  return (
    <ShareIntentProvider options={{ resetOnBackground: true, debug: false }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ConnectionProvider>
            <EmbeddingsProvider>
              <StatusBar style="auto" />
              <ShareIntentGate />
              {__DEV__ ? <PipelineSelfTest /> : null}
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                <Stack.Screen name="share" options={{ presentation: 'modal' }} />
              </Stack>
            </EmbeddingsProvider>
          </ConnectionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  )
}
