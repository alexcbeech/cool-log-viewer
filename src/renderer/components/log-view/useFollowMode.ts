import { useEffect, useRef } from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'

export function useFollowMode(
  parentRef: React.RefObject<HTMLDivElement | null>,
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  followMode: boolean,
  lineCount: number
): void {
  const prevLineCount = useRef(lineCount)
  const prevFollowMode = useRef(followMode)

  useEffect(() => {
    if (lineCount === 0) {
      prevLineCount.current = lineCount
      prevFollowMode.current = followMode
      return
    }

    const justEnabled = followMode && !prevFollowMode.current
    const newLines = followMode && lineCount > prevLineCount.current
    const initialLoad = followMode && prevLineCount.current === 0 && lineCount > 0

    if (justEnabled || newLines || initialLoad) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(lineCount - 1, { align: 'end' })
      })
    }

    prevLineCount.current = lineCount
    prevFollowMode.current = followMode
  }, [followMode, lineCount, virtualizer])
}
