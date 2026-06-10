import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { Screen } from '@/components/Screen'
import { Card, ScreenTitle, SectionTitle } from '@/components/ui'
import { useConnection } from '@/connection/ConnectionContext'
import { MUTED, PRIMARY } from '@/theme/colors'

interface MenuItem {
  href: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
  hint: string
}

const ITEMS: MenuItem[] = [
  { href: '/more/blog', icon: 'newspaper-outline', label: 'Blog', hint: 'Your auto-written posts' },
  {
    href: '/more/timeline',
    icon: 'time-outline',
    label: 'Timeline',
    hint: 'What you did, capture by capture',
  },
  {
    href: '/more/saved',
    icon: 'bookmark-outline',
    label: 'Saved',
    hint: 'Items you shared into 2brn',
  },
  {
    href: '/more/instructions',
    icon: 'options-outline',
    label: 'Instructions',
    hint: 'Guide how entries are written',
  },
  {
    href: '/more/settings',
    icon: 'settings-outline',
    label: 'Settings',
    hint: 'Connection, capture, about',
  },
]

function Row({ item }: { item: MenuItem }) {
  return (
    <Link href={item.href} asChild>
      <Pressable className="flex-row items-center px-4 py-3.5 active:bg-slate-100 dark:active:bg-slate-800">
        <Ionicons name={item.icon} size={20} color={PRIMARY} />
        <View className="ml-3 flex-1">
          <Text className="text-base text-slate-900 dark:text-slate-100">{item.label}</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">{item.hint}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={MUTED} />
      </Pressable>
    </Link>
  )
}

export default function More() {
  const { state } = useConnection()
  return (
    <Screen scroll>
      <ScreenTitle>More</ScreenTitle>

      <SectionTitle>Connected to</SectionTitle>
      <Card className="mb-4">
        <Text className="text-sm text-slate-900 dark:text-slate-100">
          {state.status === 'paired' ? state.baseUrl : '—'}
        </Text>
        {state.status === 'paired' && state.mock ? (
          <Text className="mt-0.5 text-xs font-medium text-amber-500">Mock mode · demo data</Text>
        ) : state.status === 'paired' && state.version ? (
          <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            daemon {state.version}
          </Text>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        {ITEMS.map((it, i) => (
          <View key={it.href}>
            {i > 0 ? <View className="ml-12 h-px bg-slate-100 dark:bg-slate-800" /> : null}
            <Row item={it} />
          </View>
        ))}
      </Card>
    </Screen>
  )
}
