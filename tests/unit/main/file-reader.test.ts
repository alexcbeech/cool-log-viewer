import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { readFromOffset, readLastLines } from '../../../src/main/tail-engine/file-reader'

const tempDirectories: string[] = []

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function createFile(content: string | Buffer): string {
  const directory = mkdtempSync(join(tmpdir(), 'cool-log-viewer-'))
  tempDirectories.push(directory)
  const filePath = join(directory, 'test.log')
  writeFileSync(filePath, content)
  return filePath
}

describe('readLastLines', () => {
  it('returns only the requested final lines', async () => {
    const filePath = createFile('one\ntwo\nthree\nfour\n')
    const result = await readLastLines(filePath, 2)

    expect(result.lines).toEqual(['three', 'four'])
    expect(result.hasTrailingPartial).toBe(false)
  })

  it('reports an unfinished final line', async () => {
    const filePath = createFile('one\ntwo')
    const result = await readLastLines(filePath, 10)

    expect(result.lines).toEqual(['one', 'two'])
    expect(result.hasTrailingPartial).toBe(true)
  })
})

describe('readFromOffset', () => {
  it('returns raw bytes so decoding can span multiple reads', async () => {
    const content = Buffer.from('first\nsecond\n')
    const filePath = createFile(content)
    const result = await readFromOffset(filePath, Buffer.from('first\n').length)

    expect(result.content.toString('utf8')).toBe('second\n')
    expect(result.byteOffset).toBe(content.length)
  })

  it('signals truncation with a negative offset', async () => {
    const filePath = createFile('short')
    const result = await readFromOffset(filePath, 100)

    expect(result.byteOffset).toBe(-1)
    expect(result.content).toHaveLength(0)
  })
})
