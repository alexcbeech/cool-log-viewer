import React, { useRef, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { LogLine } from './LogLine'
import { useLogStore } from '../../stores/log-store'
import { useSearchStore } from '../../stores/search-store'
import { useHighlightStore } from '../../stores/highlight-store'
import { useFollowMode } from './useFollowMode'
import { ROW_HEIGHT, OVERSCAN_COUNT } from '../../lib/constants'

interface LogViewProps {
  paneId: string
}

export const LogView: React.FC<LogViewProps> = ({ paneId }) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const paneState = useLogStore((s) => s.panes.get(paneId))
  const lines = paneState?.lines ?? []
  const followMode = paneState?.followMode ?? true
  const setFollowMode = useLogStore((s) => s.setFollowMode)
  const searchState = useSearchStore((s) => s.getSearchState(paneId))
  const compiledRules = useHighlightStore((s) => s.compiledRules)

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN_COUNT
  })

  // Follow mode: scroll to bottom on new lines
  useFollowMode(parentRef, virtualizer, followMode, lines.length)

  // Detect manual scroll-up to disable follow mode
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !followMode) return
    const el = parentRef.current
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < ROW_HEIGHT * 2
    if (!isAtBottom) {
      setFollowMode(paneId, false)
    }
  }, [followMode, paneId, setFollowMode])

  // Re-enable follow mode on scroll to bottom
  const handleScrollEnd = useCallback(() => {
    if (!parentRef.current || followMode) return
    const el = parentRef.current
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < ROW_HEIGHT * 2
    if (isAtBottom) {
      setFollowMode(paneId, true)
    }
  }, [followMode, paneId, setFollowMode])

  // Scroll to current search match
  useEffect(() => {
    if (searchState.currentMatchIndex >= 0 && searchState.matches.length > 0) {
      const match = searchState.matches[searchState.currentMatchIndex]
      if (match) {
        virtualizer.scrollToIndex(match.lineIndex, { align: 'center' })
      }
    }
  }, [searchState.currentMatchIndex, searchState.matches, virtualizer])

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto bg-[var(--bg-primary)]"
      onScroll={() => {
        handleScroll()
        handleScrollEnd()
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const line = lines[virtualRow.index]
          if (!line) return null

          const matchesForLine = searchState.matches.filter(
            (m) => m.lineIndex === virtualRow.index
          )
          const currentMatch = searchState.currentMatchIndex >= 0
            ? searchState.matches[searchState.currentMatchIndex]
            : null
          const isCurrentMatchLine = currentMatch?.lineIndex === virtualRow.index

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <LogLine
                line={line}
                compiledRules={compiledRules}
                searchMatches={matchesForLine}
                currentMatch={isCurrentMatchLine ? currentMatch : null}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
