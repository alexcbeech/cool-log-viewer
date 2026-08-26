import { useEffect, useRef } from 'react'
import { useSearchStore, type SearchMatch } from '../../stores/search-store'
import { useLogStore } from '../../stores/log-store'

let searchWorker: Worker | null = null
let searchRequestId = 0

function getSearchWorker(): Worker {
  if (!searchWorker) {
    searchWorker = new Worker(new URL('./search-worker.ts', import.meta.url), {
      type: 'module'
    })
  }
  return searchWorker
}

export function useSearch(paneId: string): void {
  const searchState = useSearchStore((s) => s.getSearchState(paneId))
  const paneLogState = useLogStore((s) => s.panes.get(paneId))
  const paneLines = paneLogState?.lines
  const setMatches = useSearchStore((s) => s.setMatches)
  const setIsSearching = useSearchStore((s) => s.setIsSearching)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    let worker: Worker | null = null
    let handler: ((event: MessageEvent) => void) | null = null

    if (!searchState.query || !paneLines) {
      setMatches(paneId, [])
      setIsSearching(paneId, false)
      return
    }

    setIsSearching(paneId, true)

    debounceRef.current = setTimeout(() => {
      worker = getSearchWorker()
      const requestId = ++searchRequestId

      handler = (event: MessageEvent): void => {
        const data = event.data as { requestId: number; matches: SearchMatch[] }
        if (data.requestId === requestId) {
          setMatches(paneId, data.matches)
          worker?.removeEventListener('message', handler!)
          handler = null
        }
      }

      worker.addEventListener('message', handler)
      worker.postMessage({
        requestId,
        paneId,
        lines: paneLines.map((l) => l.text),
        query: searchState.query,
        isRegex: searchState.isRegex,
        caseSensitive: searchState.caseSensitive
      })
    }, 150)

    return () => {
      clearTimeout(debounceRef.current)
      if (worker && handler) worker.removeEventListener('message', handler)
    }
  }, [
    paneId,
    searchState.query,
    searchState.isRegex,
    searchState.caseSensitive,
    paneLines,
    setMatches,
    setIsSearching
  ])
}
