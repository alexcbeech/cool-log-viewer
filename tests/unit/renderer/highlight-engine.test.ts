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
    it('finds a single occurrence of a string pattern', () => {
      const rule = makeRule({ pattern: 'ERROR', color: '#ff0000', backgroundColor: '#110000' })
      const compiled = compileString('ERROR', rule)

      const result = highlightLine('line with ERROR inside', [compiled])

      expect(result).toEqual([
        { start: 10, end: 15, color: '#ff0000', backgroundColor: '#110000' }
      ])
    })

    it('finds multiple occurrences of a string pattern', () => {
      const rule = makeRule({ pattern: 'ab' })
      const compiled = compileString('ab', rule)

      const result = highlightLine('ab--ab--ab', [compiled])

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({ start: 0, end: 2 })
      expect(result[1]).toMatchObject({ start: 4, end: 6 })
      expect(result[2]).toMatchObject({ start: 8, end: 10 })
    })

    it('returns empty when string pattern is not found', () => {
      const rule = makeRule({ pattern: 'MISSING' })
      const compiled = compileString('MISSING', rule)

      const result = highlightLine('nothing here', [compiled])
      expect(result).toEqual([])
    })
  })

  describe('regex pattern matching', () => {
    it('matches a regex pattern', () => {
      const rule = makeRule({ pattern: '\\d+', isRegex: true, color: '#00ff00', backgroundColor: '#001100' })
      const compiled = compileRegex('\\d+', rule)

      const result = highlightLine('count: 42 items', [compiled])

      expect(result).toEqual([
        { start: 7, end: 9, color: '#00ff00', backgroundColor: '#001100' }
      ])
    })

    it('matches multiple regex occurrences', () => {
      const rule = makeRule({ pattern: '[A-Z]+', isRegex: true })
      const compiled = compileRegex('[A-Z]+', rule)

      const result = highlightLine('aERRORbWARNc', [compiled])

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ start: 1, end: 6 })
      expect(result[1]).toMatchObject({ start: 7, end: 11 })
    })
  })

  describe('overlap resolution', () => {
    it('higher priority (earlier in list) rule wins on full overlap', () => {
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

      // Higher-priority rule is added first in the array
      const result = highlightLine('an ERROR occurred', [highCompiled, lowCompiled])

      // The first span (from highCompiled) should claim the range;
      // the second identical span from lowCompiled should be fully overlapped and dropped.
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        start: 3,
        end: 8,
        color: '#ff0000',
        backgroundColor: '#110000'
      })
    })

    it('partially overlapping spans are trimmed', () => {
      // First rule matches positions 0-5, second matches 3-8
      const ruleA = makeRule({ id: 'a', pattern: 'abcde', color: '#aa0000', backgroundColor: '#110000' })
      const ruleB = makeRule({ id: 'b', pattern: 'defgh', color: '#00bb00', backgroundColor: '#001100' })
      const compiledA = compileString('abcde', ruleA)
      const compiledB = compileString('defgh', ruleB)

      // text: "abcdefgh" -> ruleA matches [0,5), ruleB matches [3,8)
      const result = highlightLine('abcdefgh', [compiledA, compiledB])

      // ruleA's span [0,5) comes first. ruleB's span [3,8) partially overlaps,
      // so it gets trimmed to [5,8)
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ start: 0, end: 5, color: '#aa0000' })
      expect(result[1]).toMatchObject({ start: 5, end: 8, color: '#00bb00' })
    })
  })

  describe('case insensitive matching', () => {
    it('matches regardless of case when caseSensitive is false', () => {
      const rule = makeRule({ pattern: 'error', caseSensitive: false, color: '#ff0000', backgroundColor: '#000000' })
      const compiled = compileString('error', rule)

      const result = highlightLine('An ERROR and an Error occurred', [compiled])

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ start: 3, end: 8 })
      expect(result[1]).toMatchObject({ start: 16, end: 21 })
    })

    it('does not match different case when caseSensitive is true', () => {
      const rule = makeRule({ pattern: 'error', caseSensitive: true })
      const compiled = compileString('error', rule)

      const result = highlightLine('An ERROR occurred', [compiled])
      expect(result).toEqual([])
    })
  })
})
