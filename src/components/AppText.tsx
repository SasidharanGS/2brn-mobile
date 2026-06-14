import { Text, type TextProps, type TextStyle } from 'react-native'

import { useTheme } from '@/theme/ThemeContext'

/**
 * Themed text. RN `<Text>` does NOT inherit `fontFamily`/`textTransform` from a
 * parent, so raw inline `<Text>` renders in the system font and Title-case even
 * under the minimal skin. `AppText` reads the active skin and applies the right
 * font + casing (+ minimal's 300/400 weight), so inline chrome labels match the
 * themed primitives. Modern is unchanged (system font, normal case, className
 * weight kept). Pass `emphasis` for the 400 weight in minimal.
 *
 * Use this for CHROME labels. For data/value strings (URLs, model names) pass
 * `preserveCase` — they still get Inter + the minimal weight, but keep their
 * original casing. Never lowercase user/prose/message/memory content.
 */
export function AppText({
  emphasis,
  preserveCase,
  style,
  ...props
}: TextProps & { emphasis?: boolean; preserveCase?: boolean }) {
  const { skin, tokens } = useTheme()
  const minimal = skin === 'minimal'
  const themed: TextStyle = {
    fontFamily: tokens.fontSans,
    textTransform: tokens.lowercase && !preserveCase ? 'lowercase' : undefined,
    ...(minimal ? { fontWeight: emphasis ? '400' : '300' } : null),
  }
  return <Text {...props} style={[themed, style]} />
}
