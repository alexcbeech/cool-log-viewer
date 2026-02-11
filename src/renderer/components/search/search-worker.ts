interface SearchRequest {
  paneId: string
  lines: string[]
  query: string
  isRegex: boolean
  caseSensitive: boolean
}

interface SearchMatch {
  lineIndex: number
  start: number
  end: number
}

self.onmessage = (event: MessageEvent<SearchRequest>) => {
  const { paneId, lines, query, isRegex, caseSensitive } = event.data
  const matches: SearchMatch[] = []

  try {
    const flags = caseSensitive ? 'g' : 'gi'
    const pattern = isRegex ? query : escapeRegex(query)
    const regex = new RegExp(pattern, flags)

    for (let i = 0; i < lines.length; i++) {
      regex.lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(lines[i])) !== null) {
        if (match[0].length === 0) {
          regex.lastIndex++
          continue
        }
        matches.push({
          lineIndex: i,
          start: match.index,
          end: match.index + match[0].length
        })
      }
    }
  } catch {
    // Invalid regex — return empty matches
  }

  self.postMessage({ paneId, matches })
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
