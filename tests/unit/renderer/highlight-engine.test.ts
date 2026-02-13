import { describe, it, expect } from 'vitest'
import { highlightLine } from '@renderer/lib/highlight-engine'
import type { CompiledRule, HighlightRule } from '@renderer/types/highlight'

function makeRule(overrides: Partial<HighlightRule> = {}): HighlightRule {
  return {
    id: 'rule-1',
    label: 'test',
    pattern: '',
    isRegex: false,
    caseSensitive: true,
    color: '#ff0000',
    backgroundColor: '#000000',
    enabled: true,
    priority: 0,
    ...overrides
  }
}

function compileString(pattern: string, rule: HighlightRule): CompiledRule {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const flags = rule.caseSensitive ? 'g' : 'gi'
  return { rule, regex: new RegExp(escaped, flags) }
}

function compileRegex(pattern: string, rule: HighlightRule): CompiledRule {
  const flags = rule.caseSensitive ? 'g' : 'gi'
  return { rule, regex: new RegExp(pattern, flags) }
}

describe('highlightLine', () => {
  it('returns empty spans when rules list is empty', () => {
    const result = highlightLine('some text', [])
    expect(result).toEqual([])
  })

  it('returns empty spans when text is empty', () => {
    const rule = makeRule({ pattern: 'error' })
    const compiled = compileString('error', rule)
    const result = highlightLine('', [compiled])
    expect(result).toEqual([])
  })

  describe('single string pattern matching', () => {
    it('highlights the entire line when pattern matches', () => {
      const rule = makeRule({ pattern: 'ERROR', color: '#ff0000', backgroundColor: '#110000' })
      const compiled = compileString('ERROR', rule)
      const text = 'line with ERROR inside'

      const result = highlightLine(text, [compiled])

      expect(result).toEqual([
        { start: 0, end: text.length, color: '#ff0000', backgroundColor: '#110000' }
      ])
    })

    it('returns a single full-line span even with multiple occurrences', () => {
      const rule = makeRule({ pattern: 'ab' })
      const compiled = compileString('ab', rule)
      const text = 'ab--ab--ab'

      const result = highlightLine(text, [compiled])

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ start: 0, end: text.length })
    })

    it('returns empty when string pattern is not found', () => {
      const rule = makeRule({ pattern: 'MISSING' })
      const compiled = compileString('MISSING', rule)

      const result = highlightLine('nothing here', [compiled])
      expect(result).toEqual([])
    })
  })

  describe('regex pattern matching', () => {
    it('highlights the entire line when regex matches', () => {
      const rule = makeRule({ pattern: '\\d+', isRegex: true, color: '#00ff00', backgroundColor: '#001100' })
      const compiled = compileRegex('\\d+', rule)
      const text = 'count: 42 items'

      const result = highlightLine(text, [compiled])

      expect(result).toEqual([
        { start: 0, end: text.length, color: '#00ff00', backgroundColor: '#001100' }
      ])
    })

    it('returns a single full-line span even with multiple regex matches', () => {
      const rule = makeRule({ pattern: '[A-Z]+', isRegex: true })
      const compiled = compileRegex('[A-Z]+', rule)
      const text = 'aERRORbWARNc'

      const result = highlightLine(text, [compiled])

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ start: 0, end: text.length })
    })
  })

  describe('overlap resolution', () => {
    it('higher priority (earlier in list) rule wins when both match', () => {
      const highRule = makeRule({
        id: 'high',
        pattern: 'ERROR',
        color: '#ff0000',
        backgroundColor: '#110000',
        priority: 10
      })
      const lowRule = makeRule({
        id: 'low',
        pattern: 'ERROR',
        color: '#00ff00',
        backgroundColor: '#001100',
        priority: 1
      })

      const highCompiled = compileString('ERROR', highRule)
      const lowCompiled = compileString('ERROR', lowRule)
      const text = 'an ERROR occurred'

      // Higher-priority rule is added first in the array
      const result = highlightLine(text, [highCompiled, lowCompiled])

      // Both rules match the full line, but overlap resolution keeps the first
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        start: 0,
        end: text.length,
        color: '#ff0000',
        backgroundColor: '#110000'
      })
    })

    it('both rules produce full-line spans when matching different patterns', () => {
      const ruleA = makeRule({ id: 'a', pattern: 'abc', color: '#aa0000', backgroundColor: '#110000' })
      const ruleB = makeRule({ id: 'b', pattern: 'fgh', color: '#00bb00', backgroundColor: '#001100' })
      const compiledA = compileString('abc', ruleA)
      const compiledB = compileString('fgh', ruleB)
      const text = 'abcdefgh'

      const result = highlightLine(text, [compiledA, compiledB])

      // Both match the full line, overlap resolution keeps the first
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ start: 0, end: text.length, color: '#aa0000' })
    })
  })

  describe('case insensitive matching', () => {
    it('matches regardless of case when caseSensitive is false', () => {
      const rule = makeRule({ pattern: 'error', caseSensitive: false, color: '#ff0000', backgroundColor: '#000000' })
      const compiled = compileString('error', rule)
      const text = 'An ERROR and an Error occurred'

      const result = highlightLine(text, [compiled])

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ start: 0, end: text.length })
    })

    it('does not match different case when caseSensitive is true', () => {
      const rule = makeRule({ pattern: 'error', caseSensitive: true })
      const compiled = compileString('error', rule)

      const result = highlightLine('An ERROR occurred', [compiled])
      expect(result).toEqual([])
    })
  })
})
