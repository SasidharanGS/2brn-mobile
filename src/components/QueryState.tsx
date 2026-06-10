// One place for the loading → error → empty → data ladder that every data screen
// repeats. Wrap a TanStack Query result and render the right state; the happy path is
// a render-prop that receives the (defined) data.
//
//   <QueryState query={q} isEmpty={(d) => d.length === 0} empty={<EmptyState … />}>
//     {(data) => data.map(…)}
//   </QueryState>
import { type ReactNode } from 'react'

import { ErrorState, Loading } from './states'

/** The slice of a TanStack Query result this needs — kept structural so any query fits. */
interface QueryLike<T> {
  isLoading: boolean
  error: unknown
  data: T | undefined
  refetch: () => unknown
}

interface QueryStateProps<T> {
  query: QueryLike<T>
  /** Rendered with the resolved (non-empty) data. */
  children: (data: T) => ReactNode
  /** Decide emptiness from the data (default: never empty). */
  isEmpty?: (data: T) => boolean
  /** Rendered when the query resolved but `isEmpty` is true (or data is missing). */
  empty?: ReactNode
  /** Override the loading element (default `<Loading />`); pass `null` to render nothing. */
  loading?: ReactNode
  /** Override the error element (default `<ErrorState … onRetry={refetch} />`). */
  errorFallback?: ReactNode
}

export function QueryState<T>({
  query,
  children,
  isEmpty,
  empty,
  loading,
  errorFallback,
}: QueryStateProps<T>) {
  if (query.isLoading) return <>{loading === undefined ? <Loading /> : loading}</>
  if (query.error)
    return (
      <>
        {errorFallback === undefined ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          errorFallback
        )}
      </>
    )
  if (query.data === undefined || isEmpty?.(query.data)) return <>{empty ?? null}</>
  return <>{children(query.data)}</>
}
