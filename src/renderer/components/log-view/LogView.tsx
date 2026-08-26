import React, { useRef, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { LogLine } from './LogLine'
import { useLogStore } from '../../stores/log-store'
import { useSearchStore } from '../../stores/search-store'
import { useHighlightStore } from '../../stores/highlight-store'
import { useConfigStore } from '../../stores/config-store'
import { useFollowMode } from './useFollowMode'
import { OVERSCAN_COUNT, getRowHeight } from '../../lib/constants'

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
  const fontSize = useConfigStore((s) => s.config.fontSize)
  const rowHeight = getRowHeight(fontSize)

  // TanStack Virtual intentionally returns non-memoizable functions; React Compiler skips this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: OVERSCAN_COUNT
  })

  // Re-measure all rows when font size changes
  useEffect(() => {
    virtualizer.measure()
  }, [rowHeight, virtualizer])

  // Follow mode: scroll to bottom on new lines
  useFollowMode(parentRef, virtualizer, followMode, lines.length)

  // Detect manual scroll-up to disable follow mode
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !followMode) return
    const el = parentRef.current
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < rowHeight * 2
    if (!isAtBottom) {
      setFollowMode(paneId, false)
    }
  }, [followMode, paneId, setFollowMode, rowHeight])

  // Re-enable follow mode on scroll to bottom
  const handleScrollEnd = useCallback(() => {
    if (!parentRef.current || followMode) return
    const el = parentRef.current
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < rowHeight * 2
    if (isAtBottom) {
      setFollowMode(paneId, true)
    }
  }, [followMode, paneId, setFollowMode, rowHeight])

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
          minWidth: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const line = lines[virtualRow.index]
          if (!line) return null

          const matchesForLine = searchState.matches.filter((m) => m.lineIndex === virtualRow.index)
          const currentMatch =
            searchState.currentMatchIndex >= 0
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
                minWidth: '100%',
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
