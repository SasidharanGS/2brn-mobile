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
import { OcrProvider } from '@/ml/OcrContext'
import { rankBySimilarity } from '@/ml/search'

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

/** Phase 0 (Steps 1–4): dev-only money-shot check — seed a few topical memories,
 *  search by meaning, confirm the relevant one ranks first, then clean up.
 *  Logs to Metro / logcat once the model loads. */
function SearchSelfTest() {
  const { embed, isReady } = useEmbeddings()
  useEffect(() => {
    if (!isReady) return
    void (async () => {
      const seed = [
        'Notes on database pricing tiers and monthly cost',
        'Sourdough bread recipe with an overnight starter',
        'Q3 product roadmap planning meeting',
      ]
      const ids: number[] = []
      try {
        for (const text of seed) {
          ids.push(await insertMemory({ text, source: 'selftest', embedding: await embed(text) }))
        }
        const hits = rankBySimilarity(await getAllMemories(), await embed('how much does the database cost'))
        const top = hits[0]
        console.log(`[2brn-search-selftest] top="${top?.memory.text.slice(0, 30)}" score=${top?.score.toFixed(3)}`)
      } catch (e) {
        console.log('[2brn-search-selftest] FAIL', e)
      } finally {
        for (const id of ids) await deleteMemory(id)
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
              <OcrProvider>
                <StatusBar style="auto" />
                <ShareIntentGate />
                {__DEV__ ? <SearchSelfTest /> : null}
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                  <Stack.Screen name="share" options={{ presentation: 'modal' }} />
                </Stack>
              </OcrProvider>
            </EmbeddingsProvider>
          </ConnectionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  )
}
