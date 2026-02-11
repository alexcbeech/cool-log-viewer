export interface HighlightRule {
  id: string
  label: string
  pattern: string
  isRegex: boolean
  caseSensitive: boolean
  color: string
  backgroundColor: string
  enabled: boolean
  priority: number
}

export interface HighlightSpan {
  start: number
  end: number
  color: string
  backgroundColor: string
}

export interface CompiledRule {
  rule: HighlightRule
  regex: RegExp
}
