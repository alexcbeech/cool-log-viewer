import React, { useMemo } from 'react'
import type { LogLine as LogLineType } from '../../types/log'
import type { CompiledRule, HighlightSpan } from '../../types/highlight'
import type { SearchMatch } from '../../stores/search-store'
import { highlightLine } from '../../lib/highlight-engine'
import '../../assets/styles/log-line.css'

interface LogLineProps {
  line: LogLineType
  compiledRules: CompiledRule[]
  searchMatches: SearchMatch[]
  currentMatch: SearchMatch | null
}

interface RenderSpan {
  start: number
  end: number
  text: string
  className?: string
  style?: React.CSSProperties
}

export const LogLine: React.FC<LogLineProps> = React.memo(
  ({ line, compiledRules, searchMatches, currentMatch }) => {
    const spans = useMemo(() => {
      const text = line.text
      if (text.length === 0) return [{ start: 0, end: 0, text: '' }]

      const highlights = highlightLine(text, compiledRules)
      return buildRenderSpans(text, highlights, searchMatches, currentMatch)
    }, [line.text, compiledRules, searchMatches, currentMatch])

    return (
      <div className="log-line">
        <span className="log-line-number">{line.lineNumber}</span>
        <span className="log-line-text">
          {spans.map((span, i) => {
            if (span.className || span.style) {
              return (
                <span key={i} className={span.className} style={span.style}>
                  {span.text}
                </span>
              )
            }
            return <React.Fragment key={i}>{span.text}</React.Fragment>
          })}
        </span>
      </div>
    )
  }
)

LogLine.displayName = 'LogLine'

function buildRenderSpans(
  text: string,
  highlights: HighlightSpan[],
  searchMatches: SearchMatch[],
  currentMatch: SearchMatch | null
): RenderSpan[] {
  if (highlights.length === 0 && searchMatches.length === 0) {
    return [{ start: 0, end: text.length, text }]
  }

  // Build marker points
  const points = new Set<number>()
  points.add(0)
  points.add(text.length)

  for (const h of highlights) {
    points.add(h.start)
    points.add(h.end)
  }
  for (const m of searchMatches) {
    points.add(m.start)
    points.add(m.end)
  }

  const sorted = Array.from(points).sort((a, b) => a - b)
  const result: RenderSpan[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    if (start === end) continue

    const spanText = text.slice(start, end)

    // Check if this span is the current search match
    const isCurrentSearch = currentMatch &&
      start >= currentMatch.start && end <= currentMatch.end
    if (isCurrentSearch) {
      result.push({
        start,
        end,
        text: spanText,
        className: 'search-match-current'
      })
      continue
    }

    // Check if this span is a search match
    const isSearch = searchMatches.some((m) => start >= m.start && end <= m.end)
    if (isSearch) {
      result.push({
        start,
        end,
        text: spanText,
        className: 'search-match'
      })
      continue
    }

    // Check highlight
    const highlight = highlights.find((h) => start >= h.start && end <= h.end)
    if (highlight) {
      result.push({
        start,
        end,
        text: spanText,
        className: 'highlight-span',
        style: { color: highlight.color, backgroundColor: highlight.backgroundColor }
      })
      continue
    }

    result.push({ start, end, text: spanText })
  }

  return result
}
