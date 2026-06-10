import { useMemo } from 'react'
import { useColorScheme } from 'react-native'
import MarkdownDisplay from 'react-native-markdown-display'

import { MUTED, PRIMARY } from '@/theme/colors'

/** Themed markdown renderer used for journal, blog, and chat answers. */
export function Markdown({ children }: { children: string }) {
  const dark = useColorScheme() === 'dark'
  const text = dark ? '#e2e8f0' : '#0f172a'
  const muted = dark ? MUTED : '#475569'
  const codeBg = dark ? '#1e293b' : '#e2e8f0'

  const styles = useMemo(
    () => ({
      body: { color: text, fontSize: 15, lineHeight: 23 },
      heading1: { color: text, fontSize: 22, fontWeight: '700', marginTop: 8, marginBottom: 6 },
      heading2: { color: text, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 4 },
      heading3: { color: text, fontSize: 16, fontWeight: '600', marginTop: 6, marginBottom: 4 },
      strong: { fontWeight: '700' },
      blockquote: {
        backgroundColor: dark ? '#0b1220' : '#f1f5f9',
        borderColor: PRIMARY,
        borderLeftWidth: 3,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginVertical: 6,
        color: muted,
      },
      code_inline: { backgroundColor: codeBg, color: text, borderRadius: 4, paddingHorizontal: 4 },
      fence: {
        backgroundColor: dark ? '#0b1220' : '#f1f5f9',
        color: text,
        borderRadius: 8,
        padding: 10,
      },
      code_block: {
        backgroundColor: dark ? '#0b1220' : '#f1f5f9',
        color: text,
        borderRadius: 8,
        padding: 10,
      },
      link: { color: PRIMARY },
      hr: { backgroundColor: dark ? '#334155' : '#cbd5e1', height: 1 },
      list_item: { marginVertical: 2 },
    }),
    [dark, text, muted, codeBg],
  )

  return <MarkdownDisplay style={styles}>{children}</MarkdownDisplay>
}
