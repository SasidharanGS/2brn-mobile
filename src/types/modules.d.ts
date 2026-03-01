// react-native-markdown-display ships no TypeScript types; declare the minimal
// surface we use (a default component taking a style map and a string child).
declare module 'react-native-markdown-display' {
  import type { ComponentType, ReactNode } from 'react'

  const Markdown: ComponentType<{
    style?: Record<string, unknown>
    mergeStyle?: boolean
    children?: ReactNode
  }>
  export default Markdown
}
