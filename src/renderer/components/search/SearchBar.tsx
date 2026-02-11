import React, { useEffect, useRef, useCallback } from 'react'
import { X, ChevronUp, ChevronDown, CaseSensitive, Regex } from 'lucide-react'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { Toggle } from '../common/Toggle'
import { useSearchStore } from '../../stores/search-store'
import { useLogStore } from '../../stores/log-store'
import { useSearch } from './useSearch'

interface SearchBarProps {
  paneId: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ paneId }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const searchState = useSearchStore((s) => s.getSearchState(paneId))
  const setQuery = useSearchStore((s) => s.setQuery)
  const setIsRegex = useSearchStore((s) => s.setIsRegex)
  const setCaseSensitive = useSearchStore((s) => s.setCaseSensitive)
  const setSearchOpen = useSearchStore((s) => s.setSearchOpen)
  const nextMatch = useSearchStore((s) => s.nextMatch)
  const prevMatch = useSearchStore((s) => s.prevMatch)

  useSearch(paneId)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(paneId, false)
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          prevMatch(paneId)
        } else {
          nextMatch(paneId)
        }
      } else if (e.key === 'F3') {
        e.preventDefault()
        if (e.shiftKey) {
          prevMatch(paneId)
        } else {
          nextMatch(paneId)
        }
      }
    },
    [paneId, nextMatch, prevMatch, setSearchOpen]
  )

  const matchText =
    searchState.matches.length > 0
      ? `${searchState.currentMatchIndex + 1}/${searchState.matches.length}`
      : searchState.query
        ? 'No results'
        : ''

  return (
    <div className="absolute right-2 top-1 z-20 flex items-center gap-1 rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 shadow-md">
      <Input
        ref={inputRef}
        value={searchState.query}
        onChange={(e) => setQuery(paneId, e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        className="w-48"
      />
      <Toggle
        pressed={searchState.caseSensitive}
        onPressedChange={(v) => setCaseSensitive(paneId, v)}
        title="Case Sensitive"
      >
        <CaseSensitive size={14} />
      </Toggle>
      <Toggle
        pressed={searchState.isRegex}
        onPressedChange={(v) => setIsRegex(paneId, v)}
        title="Regex"
      >
        <Regex size={14} />
      </Toggle>
      <span className="min-w-[60px] text-center text-xs text-[var(--text-secondary)]">
        {searchState.isSearching ? 'Searching...' : matchText}
      </span>
      <Button variant="icon" size="sm" onClick={() => prevMatch(paneId)} title="Previous (Shift+F3)">
        <ChevronUp size={14} />
      </Button>
      <Button variant="icon" size="sm" onClick={() => nextMatch(paneId)} title="Next (F3)">
        <ChevronDown size={14} />
      </Button>
      <Button variant="icon" size="sm" onClick={() => setSearchOpen(paneId, false)} title="Close (Escape)">
        <X size={14} />
      </Button>
    </div>
  )
}
