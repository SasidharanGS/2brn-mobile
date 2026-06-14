import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { Pressable, View } from 'react-native'

import { AppText } from '@/components/AppText'
import { Screen } from '@/components/Screen'
import { Card, ScreenTitle, SectionTitle } from '@/components/ui'
import { useConnection } from '@/connection/ConnectionContext'
import { useTheme } from '@/theme/ThemeContext'

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
  const { tokens } = useTheme()
  return (
    <Link href={item.href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={item.label}
        className="flex-row items-center px-4 py-3.5 active:bg-surface-2"
      >
        <Ionicons name={item.icon} size={20} color={tokens.colors.accent} />
        <View className="ml-3 flex-1">
          <AppText className="text-base text-fg">{item.label}</AppText>
          <AppText className="text-xs text-muted">{item.hint}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tokens.colors.muted} />
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
        <AppText className="text-sm text-fg" preserveCase>{state.status === 'paired' ? state.baseUrl : '—'}</AppText>
        {state.status === 'paired' && state.mock ? (
          <AppText className="mt-0.5 text-xs font-medium text-amber-500">Mock mode · demo data</AppText>
        ) : state.status === 'paired' && state.version ? (
          <AppText className="mt-0.5 text-xs text-muted" preserveCase>daemon {state.version}</AppText>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        {ITEMS.map((it, i) => (
          <View key={it.href}>
            {i > 0 ? <View className="ml-12 h-px bg-rule" /> : null}
            <Row item={it} />
          </View>
        ))}
      </Card>
    </Screen>
  )
}
