import { useEffect } from 'react'

export function useIpcEvent(
  subscribe: (callback: (...args: unknown[]) => void) => () => void,
  handler: (...args: unknown[]) => void,
  deps: unknown[] = []
): void {
  useEffect(() => {
    const unsubscribe = subscribe(handler)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
