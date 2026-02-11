import { describe, it, expect, beforeEach } from 'vitest'
import { LineBuffer } from '../../../src/main/tail-engine/line-buffer'

describe('LineBuffer', () => {
  let buffer: LineBuffer

  beforeEach(() => {
    buffer = new LineBuffer(10)
  })

  describe('push', () => {
    it('adds lines to the buffer', () => {
      buffer.push(['line1', 'line2', 'line3'])

      expect(buffer.getAll()).toEqual(['line1', 'line2', 'line3'])
      expect(buffer.length).toBe(3)
    })

    it('accumulates lines across multiple pushes', () => {
      buffer.push(['line1', 'line2'])
      buffer.push(['line3'])

      expect(buffer.getAll()).toEqual(['line1', 'line2', 'line3'])
      expect(buffer.length).toBe(3)
    })

    it('handles pushing an empty array', () => {
      buffer.push([])

      expect(buffer.getAll()).toEqual([])
      expect(buffer.length).toBe(0)
    })
  })

  describe('ring buffer trim', () => {
    it('trims to maxLines when exceeding capacity in a single push', () => {
      const buf = new LineBuffer(5)

      buf.push(['a', 'b', 'c', 'd', 'e', 'f', 'g'])

      // Should keep only the last 5 lines
      expect(buf.getAll()).toEqual(['c', 'd', 'e', 'f', 'g'])
      expect(buf.length).toBe(5)
    })

    it('trims to maxLines when exceeding capacity across multiple pushes', () => {
      const buf = new LineBuffer(5)

      buf.push(['a', 'b', 'c'])
      buf.push(['d', 'e', 'f'])

      // Total 6 lines, max is 5 -> keep last 5
      expect(buf.getAll()).toEqual(['b', 'c', 'd', 'e', 'f'])
      expect(buf.length).toBe(5)
    })

    it('does not trim when exactly at capacity', () => {
      const buf = new LineBuffer(3)

      buf.push(['x', 'y', 'z'])

      expect(buf.getAll()).toEqual(['x', 'y', 'z'])
      expect(buf.length).toBe(3)
    })

    it('keeps only the most recent lines', () => {
      const buf = new LineBuffer(3)

      buf.push(['1', '2', '3'])
      buf.push(['4', '5'])

      // Should have lines 3, 4, 5 (the last 3)
      expect(buf.getAll()).toEqual(['3', '4', '5'])
    })
  })

  describe('clear', () => {
    it('empties the buffer', () => {
      buffer.push(['line1', 'line2', 'line3'])

      buffer.clear()

      expect(buffer.getAll()).toEqual([])
      expect(buffer.length).toBe(0)
    })

    it('can accept new lines after clearing', () => {
      buffer.push(['old1', 'old2'])
      buffer.clear()
      buffer.push(['new1'])

      expect(buffer.getAll()).toEqual(['new1'])
      expect(buffer.length).toBe(1)
    })
  })

  describe('getAll', () => {
    it('returns all lines in order', () => {
      buffer.push(['first'])
      buffer.push(['second'])
      buffer.push(['third'])

      expect(buffer.getAll()).toEqual(['first', 'second', 'third'])
    })

    it('returns an empty array for a new buffer', () => {
      expect(buffer.getAll()).toEqual([])
    })
  })

  describe('length', () => {
    it('returns 0 for a new buffer', () => {
      expect(buffer.length).toBe(0)
    })

    it('returns the correct count after pushes', () => {
      buffer.push(['a', 'b'])
      expect(buffer.length).toBe(2)

      buffer.push(['c'])
      expect(buffer.length).toBe(3)
    })

    it('returns the capped count after trimming', () => {
      const buf = new LineBuffer(3)
      buf.push(['a', 'b', 'c', 'd', 'e'])
      expect(buf.length).toBe(3)
    })
  })
})
