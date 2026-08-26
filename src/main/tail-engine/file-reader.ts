import { close, fstat, open, read } from 'fs'
import { promisify } from 'util'
import { INITIAL_CHUNK_SIZE, READ_CHUNK_BYTES } from '@shared/constants'

const fsOpen = promisify(open)
const fsRead = promisify(read)
const fsFstat = promisify(fstat)
const fsClose = promisify(close)

export interface ReadLastLinesResult {
  lines: string[]
  byteOffset: number
  hasTrailingPartial: boolean
}

export interface ReadChunkResult {
  content: Buffer
  byteOffset: number
  hasMore: boolean
}

/**
 * Read the last N lines from end of file using backward chunk reading.
 * Never loads full file into memory — a 10GB file opens in ~1ms.
 */
export async function readLastLines(
  filePath: string,
  maxLines: number = INITIAL_CHUNK_SIZE
): Promise<ReadLastLinesResult> {
  const fd = await fsOpen(filePath, 'r')
  try {
    const stats = await fsFstat(fd)
    const fileSize = stats.size

    if (fileSize === 0) {
      return { lines: [], byteOffset: 0, hasTrailingPartial: false }
    }

    const chunks: Buffer[] = []
    let newlineCount = 0
    let position = fileSize

    while (position > 0 && newlineCount <= maxLines) {
      const chunkSize = Math.min(READ_CHUNK_BYTES, position)
      position -= chunkSize

      const buffer = Buffer.allocUnsafe(chunkSize)
      const { bytesRead } = await fsRead(fd, buffer, 0, chunkSize, position)
      const content = buffer.subarray(0, bytesRead)
      chunks.unshift(content)

      for (const byte of content) {
        if (byte === 0x0a) newlineCount++
      }
    }

    let content = Buffer.concat(chunks)
    if (position > 0) {
      const firstNewline = content.indexOf(0x0a)
      content = firstNewline >= 0 ? content.subarray(firstNewline + 1) : Buffer.alloc(0)
    }

    const hasTrailingPartial = content.length > 0 && content[content.length - 1] !== 0x0a
    const lines = content.toString('utf8').split('\n').map(stripCarriageReturn)
    if (!hasTrailingPartial) lines.pop()

    return {
      lines: lines.slice(-maxLines),
      byteOffset: fileSize,
      hasTrailingPartial
    }
  } finally {
    await fsClose(fd)
  }
}

/**
 * Read new content from a given byte offset to current end of file.
 * Used for ongoing tail.
 */
export async function readFromOffset(
  filePath: string,
  fromOffset: number
): Promise<ReadChunkResult> {
  const fd = await fsOpen(filePath, 'r')
  try {
    const stats = await fsFstat(fd)
    const fileSize = stats.size

    // Truncation detection
    if (fileSize < fromOffset) {
      return { content: Buffer.alloc(0), byteOffset: -1, hasMore: false }
    }

    if (fileSize === fromOffset) {
      return { content: Buffer.alloc(0), byteOffset: fileSize, hasMore: false }
    }

    const buffer = Buffer.allocUnsafe(Math.min(READ_CHUNK_BYTES, fileSize - fromOffset))
    const { bytesRead } = await fsRead(fd, buffer, 0, buffer.length, fromOffset)
    const byteOffset = fromOffset + bytesRead
    return {
      content: buffer.subarray(0, bytesRead),
      byteOffset,
      hasMore: byteOffset < fileSize
    }
  } finally {
    await fsClose(fd)
  }
}

function stripCarriageReturn(line: string): string {
  return line.endsWith('\r') ? line.slice(0, -1) : line
}

/**
 * Get file size without opening a read stream.
 */
export async function getFileSize(filePath: string): Promise<number> {
  const fd = await fsOpen(filePath, 'r')
  try {
    const stats = await fsFstat(fd)
    return stats.size
  } finally {
    await fsClose(fd)
  }
}
