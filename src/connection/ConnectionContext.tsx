import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'

import { createHttpClient, type ApiClient } from '@/api/client'
import { createMockClient } from '@/api/mock'
import { validateConnection, type ConnectionCheck, type PairingPayload } from './pairing'

const K_BASE = 'twobrn.baseUrl'
const K_TOKEN = 'twobrn.token'

/** Mock mode backs the app with fixtures (no daemon). Enabled via env or at build. */
export const IS_MOCK = process.env.EXPO_PUBLIC_MOCK === '1'

export type ConnectionState =
  | { status: 'loading' }
  | { status: 'unpaired' }
  | { status: 'paired'; baseUrl: string; client: ApiClient; version?: string; mock: boolean }

interface ConnectionContextValue {
  state: ConnectionState
  pair: (payload: PairingPayload) => Promise<ConnectionCheck>
  unpair: () => Promise<void>
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConnectionState>({ status: 'loading' })

  const unpair = useCallback(async () => {
    await Promise.all([SecureStore.deleteItemAsync(K_BASE), SecureStore.deleteItemAsync(K_TOKEN)]).catch(
      () => undefined,
    )
    setState({ status: 'unpaired' })
  }, [])

  // A 401 from the daemon means this device's token was revoked (or the daemon
  // tightened the master token to loopback). Drop the pairing so the app falls
  // back to the Connect-a-device screen instead of looping on errors.
  const onUnauthorized = useCallback(() => { void unpair() }, [unpair])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (IS_MOCK) {
        setState({ status: 'paired', baseUrl: 'mock://desktop', client: createMockClient(), version: 'mock', mock: true })
        return
      }
      try {
        const [baseUrl, token] = await Promise.all([
          SecureStore.getItemAsync(K_BASE),
          SecureStore.getItemAsync(K_TOKEN),
        ])
        if (cancelled) return
        if (baseUrl && token) {
          setState({ status: 'paired', baseUrl, client: createHttpClient({ baseUrl, token, onUnauthorized }), mock: false })
        } else {
          setState({ status: 'unpaired' })
        }
      } catch {
        if (!cancelled) setState({ status: 'unpaired' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [onUnauthorized])

  const pair = useCallback(async (payload: PairingPayload): Promise<ConnectionCheck> => {
    const check = await validateConnection(payload.baseUrl, payload.token)
    if (check.ok) {
      await SecureStore.setItemAsync(K_BASE, payload.baseUrl)
      await SecureStore.setItemAsync(K_TOKEN, payload.token)
      setState({
        status: 'paired',
        baseUrl: payload.baseUrl,
        client: createHttpClient({ ...payload, onUnauthorized }),
        version: check.version,
        mock: false,
      })
    }
    return check
  }, [onUnauthorized])

  const value = useMemo<ConnectionContextValue>(() => ({ state, pair, unpair }), [state, pair, unpair])
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
}

export function useConnection(): ConnectionContextValue {
  const ctx = useContext(ConnectionContext)
  if (!ctx) throw new Error('useConnection must be used within a ConnectionProvider')
  return ctx
}

/** The active API client. Throws if not paired — screens render only when paired. */
export function useApi(): ApiClient {
  const { state } = useConnection()
  if (state.status !== 'paired') {
    throw new Error('useApi called before a connection was established')
  }
  return state.client
}
