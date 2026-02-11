import { useEffect, useRef } from 'react'
import { useSearchStore, type SearchMatch } from '../../stores/search-store'
import { useLogStore } from '../../stores/log-store'

let searchWorker: Worker | null = null

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
  const setMatches = useSearchStore((s) => s.setMatches)
  const setIsSearching = useSearchStore((s) => s.setIsSearching)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(debounceRef.current)

    if (!searchState.query || !paneLogState) {
      setMatches(paneId, [])
      setIsSearching(paneId, false)
      return
    }

    setIsSearching(paneId, true)

    debounceRef.current = setTimeout(() => {
      const worker = getSearchWorker()

      const handler = (event: MessageEvent): void => {
        const data = event.data as { paneId: string; matches: SearchMatch[] }
        if (data.paneId === paneId) {
          setMatches(paneId, data.matches)
          worker.removeEventListener('message', handler)
        }
      }

      worker.addEventListener('message', handler)
      worker.postMessage({
        paneId,
        lines: paneLogState.lines.map((l) => l.text),
        query: searchState.query,
        isRegex: searchState.isRegex,
        caseSensitive: searchState.caseSensitive
      })
    }, 150)

    return () => clearTimeout(debounceRef.current)
  }, [
    paneId,
    searchState.query,
    searchState.isRegex,
    searchState.caseSensitive,
    paneLogState?.lines.length,
    setMatches,
    setIsSearching
  ])
}
