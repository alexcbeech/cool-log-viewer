import type { CompiledRule, HighlightSpan } from '../types/highlight'

export function highlightLine(text: string, compiledRules: CompiledRule[]): HighlightSpan[] {
  if (compiledRules.length === 0 || text.length === 0) return []

  const spans: HighlightSpan[] = []

  for (const { rule, regex } of compiledRules) {
    regex.lastIndex = 0
    if (regex.test(text)) {
      spans.push({
        start: 0,
        end: text.length,
        color: rule.color,
        backgroundColor: rule.backgroundColor
      })
    }
  }

  // Resolve overlaps: higher-priority rules added first, so earlier spans win
  return resolveOverlaps(spans)
}

function resolveOverlaps(spans: HighlightSpan[]): HighlightSpan[] {
  if (spans.length <= 1) return spans

  // Sort by start position, then by order (earlier = higher priority)
  const sorted = spans.slice().sort((a, b) => a.start - b.start || 0)

  const result: HighlightSpan[] = []
  let lastEnd = 0

  for (const span of sorted) {
    if (span.start >= lastEnd) {
      result.push(span)
      lastEnd = span.end
    } else if (span.end > lastEnd) {
      // Partial overlap: trim the start
      result.push({ ...span, start: lastEnd })
      lastEnd = span.end
    }
    // Fully overlapped spans are dropped
  }

  return result
}
