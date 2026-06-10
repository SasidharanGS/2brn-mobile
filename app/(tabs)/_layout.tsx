import { Ionicons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'

import { Screen } from '@/components/Screen'
import { Loading } from '@/components/states'
import { useConnection } from '@/connection/ConnectionContext'
import { PRIMARY } from '@/theme/colors'

export default function TabsLayout() {
  const { state } = useConnection()
  const dark = useColorScheme() === 'dark'

  if (state.status === 'loading') {
    return (
      <Screen>
        <Loading label="Connecting to your desktop…" />
      </Screen>
    )
  }
  if (state.status === 'unpaired') {
    // On-device-first: an unpaired phone is fully usable on its own, so land on
    // the on-device home. Pairing a desktop is opt-in from there. (Phase 3)
    return <Redirect href="/memories" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: dark ? '#64748b' : '#94a3b8',
        tabBarStyle: {
          backgroundColor: dark ? '#0b1220' : '#ffffff',
          borderTopColor: dark ? '#1e293b' : '#e2e8f0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: 'Journal', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: 'Insights', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" color={color} size={size} /> }}
      />
    </Tabs>
  )
}
