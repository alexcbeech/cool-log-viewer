import { describe, expect, it } from 'vitest'
import { LineAssembler } from '../../../src/main/tail-engine/line-assembler'

describe('LineAssembler', () => {
  it('updates an unfinished line instead of emitting fragments', () => {
    const assembler = new LineAssembler()

    expect(assembler.push(Buffer.from('hel'))).toEqual({ lines: ['hel'], replaceLast: false })
    expect(assembler.push(Buffer.from('lo'))).toEqual({ lines: ['hello'], replaceLast: true })
    expect(assembler.push(Buffer.from('\nnext'))).toEqual({
      lines: ['hello', 'next'],
      replaceLast: true
    })
  })

  it('preserves UTF-8 characters split across writes', () => {
    const assembler = new LineAssembler()
    const encoded = Buffer.from('before 😀 after\n')
    const emojiStart = Buffer.from('before ').length

    expect(assembler.push(encoded.subarray(0, emojiStart + 2))).toEqual({
      lines: ['before '],
      replaceLast: false
    })
    expect(assembler.push(encoded.subarray(emojiStart + 2))).toEqual({
      lines: ['before 😀 after'],
      replaceLast: true
    })
  })

  it('continues a partial line loaded during the initial read', () => {
    const assembler = new LineAssembler()
    assembler.initialize('existing')

    expect(assembler.push(Buffer.from(' line\n'))).toEqual({
      lines: ['existing line'],
      replaceLast: true
    })
  })

  it('normalizes CRLF endings', () => {
    const assembler = new LineAssembler()
    expect(assembler.push(Buffer.from('one\r\ntwo\r\n'))).toEqual({
      lines: ['one', 'two'],
      replaceLast: false
    })
  })
})
