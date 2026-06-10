import '../global.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent'
import { useEffect } from 'react'
import { initExecutorch, useTextEmbeddings } from 'react-native-executorch'
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@/api/queryClient'
import { ConnectionProvider } from '@/connection/ConnectionContext'
import { selfTest } from '@/db/local'
import { EMBEDDING_MODEL } from '@/ml/embeddings'
import { cosineSimilarity } from '@/ml/similarity'

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

/** Phase 0, Step 2: dev-only embeddings sanity check — similar text should score
 *  far higher than unrelated text. Logs to Metro / logcat once the model loads. */
function EmbedSelfTest() {
  const emb = useTextEmbeddings({ model: EMBEDDING_MODEL })
  useEffect(() => {
    if (!emb.isReady) return
    void (async () => {
      try {
        const a = await emb.forward('The cat sat on the mat')
        const b = await emb.forward('A kitten rested on the rug')
        const c = await emb.forward('Quarterly revenue rose twelve percent')
        console.log(
          `[2brn-embed-selftest] dim=${a.length} similar=${cosineSimilarity(a, b).toFixed(3)} unrelated=${cosineSimilarity(a, c).toFixed(3)}`,
        )
      } catch (e) {
        console.log('[2brn-embed-selftest] FAIL', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emb.isReady])
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
            {__DEV__ ? <DbSelfTest /> : null}
            {__DEV__ ? <EmbedSelfTest /> : null}
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="share" options={{ presentation: 'modal' }} />
            </Stack>
          </ConnectionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  )
}
