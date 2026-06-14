import { Ionicons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'

import { Screen } from '@/components/Screen'
import { Loading } from '@/components/states'
import { useConnection } from '@/connection/ConnectionContext'
import { useTheme } from '@/theme/ThemeContext'

export default function TabsLayout() {
  const { state } = useConnection()
  const { tokens } = useTheme()

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
        tabBarActiveTintColor: tokens.colors.accent,
        tabBarInactiveTintColor: tokens.colors.muted,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.rule,
        },
        tabBarLabelStyle: {
          fontFamily: tokens.fontSans,
          textTransform: tokens.lowercase ? 'lowercase' : undefined,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
