import { appendFileSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { TailEngine } from '../../../src/main/tail-engine/tail-engine'

const tempDirectories: string[] = []

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('TailEngine integration', () => {
  it('follows appends, truncation, and file rotation', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'cool-log-viewer-tail-'))
    tempDirectories.push(directory)
    const filePath = join(directory, 'application.log')
    writeFileSync(filePath, 'initial\n')

    const engine = new TailEngine()
    let visibleLines: string[] = []
    const errors: Error[] = []

    await engine.startTail(
      'pane-1',
      filePath,
      (lines, isInitial, replaceLast = false) => {
        if (isInitial) visibleLines = []
        if (replaceLast) visibleLines.pop()
        visibleLines.push(...lines)
      },
      (error) => errors.push(error)
    )

    try {
      await expectEventually(() => visibleLines, ['initial'])

      appendFileSync(filePath, 'appended\n')
      await expectEventually(() => visibleLines, ['initial', 'appended'])

      writeFileSync(filePath, 'after truncate\n')
      await expectEventually(() => visibleLines, ['after truncate'])

      renameSync(filePath, `${filePath}.1`)
      writeFileSync(filePath, 'after rotation\n')
      await expectEventually(() => visibleLines, ['after rotation'], 8_000)

      expect(errors).toEqual([])
    } finally {
      await engine.stopAll()
    }
  }, 15_000)
})

async function expectEventually<T>(
  readValue: () => T,
  expected: T,
  timeoutMs = 5_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (JSON.stringify(readValue()) === JSON.stringify(expected)) return
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  expect(readValue()).toEqual(expected)
}
