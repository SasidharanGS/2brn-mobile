import { useMemo } from 'react'
import MarkdownDisplay from 'react-native-markdown-display'

import { useTheme } from '@/theme/ThemeContext'

/** Themed markdown renderer used for journal, blog, and chat answers. */
export function Markdown({ children }: { children: string }) {
  const { tokens } = useTheme()
  const c = tokens.colors

  const styles = useMemo(
    () => ({
      body: { color: c.fg, fontSize: 15, lineHeight: 23 },
      heading1: { color: c.fg, fontSize: 22, fontWeight: '700', marginTop: 8, marginBottom: 6 },
      heading2: { color: c.fg, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 4 },
      heading3: { color: c.fg, fontSize: 16, fontWeight: '600', marginTop: 6, marginBottom: 4 },
      strong: { fontWeight: '700' },
      blockquote: {
        backgroundColor: c.surface2,
        borderColor: c.accent,
        borderLeftWidth: 3,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginVertical: 6,
        color: c.muted,
      },
      code_inline: { backgroundColor: c.surface2, color: c.fg, borderRadius: 4, paddingHorizontal: 4 },
      fence: { backgroundColor: c.surface2, color: c.fg, borderRadius: 8, padding: 10 },
      code_block: { backgroundColor: c.surface2, color: c.fg, borderRadius: 8, padding: 10 },
      link: { color: c.accent },
      hr: { backgroundColor: c.border, height: 1 },
      list_item: { marginVertical: 2 },
    }),
    [c],
  )

  return <MarkdownDisplay style={styles}>{children}</MarkdownDisplay>
}
