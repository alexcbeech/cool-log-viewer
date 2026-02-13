import React, { useMemo } from 'react'
import type { LogLine as LogLineType } from '../../types/log'
import type { CompiledRule } from '../../types/highlight'
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
    const highlights = useMemo(
      () => highlightLine(line.text, compiledRules),
      [line.text, compiledRules]
    )
    // First matching highlight wins (highest priority)
    const lineHighlight = highlights.length > 0 ? highlights[0] : null

    const spans = useMemo(() => {
      const text = line.text
      if (text.length === 0) return [{ start: 0, end: 0, text: '' }]
      return buildRenderSpans(text, searchMatches, currentMatch)
    }, [line.text, searchMatches, currentMatch])

    const lineStyle: React.CSSProperties | undefined = lineHighlight
      ? { backgroundColor: lineHighlight.backgroundColor }
      : undefined

    const textStyle: React.CSSProperties | undefined = lineHighlight
      ? { color: lineHighlight.color }
      : undefined

    return (
      <div className="log-line" style={lineStyle}>
        <span className="log-line-number">{line.lineNumber}</span>
        <span className="log-line-text" style={textStyle}>
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
  searchMatches: SearchMatch[],
  currentMatch: SearchMatch | null
): RenderSpan[] {
  if (searchMatches.length === 0) {
    return [{ start: 0, end: text.length, text }]
  }

  // Build marker points
  const points = new Set<number>()
  points.add(0)
  points.add(text.length)

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

    result.push({ start, end, text: spanText })
  }

  return result
}
