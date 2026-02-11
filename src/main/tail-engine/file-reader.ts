import { open, read, fstat, close } from 'fs'
import { promisify } from 'util'
import { READ_CHUNK_BYTES, INITIAL_CHUNK_SIZE } from '@shared/constants'

const fsOpen = promisify(open)
const fsRead = promisify(read)
const fsFstat = promisify(fstat)
const fsClose = promisify(close)

export interface ReadResult {
  lines: string[]
  byteOffset: number
}

/**
 * Read the last N lines from end of file using backward chunk reading.
 * Never loads full file into memory — a 10GB file opens in ~1ms.
 */
export async function readLastLines(
  filePath: string,
  maxLines: number = INITIAL_CHUNK_SIZE
): Promise<ReadResult> {
  const fd = await fsOpen(filePath, 'r')
  try {
    const stats = await fsFstat(fd)
    const fileSize = stats.size

    if (fileSize === 0) {
      return { lines: [], byteOffset: 0 }
    }

    const lines: string[] = []
    let remainder = ''
    let position = fileSize

    while (position > 0 && lines.length < maxLines) {
      const chunkSize = Math.min(READ_CHUNK_BYTES, position)
      position -= chunkSize

      const buffer = Buffer.alloc(chunkSize)
      await fsRead(fd, buffer, 0, chunkSize, position)

      const chunk = buffer.toString('utf-8') + remainder
      const chunkLines = chunk.split('\n')

      // The first element might be a partial line
      remainder = chunkLines[0]

      // Add complete lines in reverse
      for (let i = chunkLines.length - 1; i >= 1; i--) {
        lines.unshift(chunkLines[i])
        if (lines.length >= maxLines) break
      }
    }

    // Add any remaining text as the first line
    if (remainder && lines.length < maxLines) {
      lines.unshift(remainder)
    }

    // Remove trailing empty line from final newline
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }

    return { lines, byteOffset: fileSize }
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
): Promise<ReadResult> {
  const fd = await fsOpen(filePath, 'r')
  try {
    const stats = await fsFstat(fd)
    const fileSize = stats.size

    // Truncation detection
    if (fileSize < fromOffset) {
      return { lines: [], byteOffset: -1 } // -1 signals truncation
    }

    if (fileSize === fromOffset) {
      return { lines: [], byteOffset: fileSize }
    }

    const bytesToRead = fileSize - fromOffset
    const buffer = Buffer.alloc(bytesToRead)
    await fsRead(fd, buffer, 0, bytesToRead, fromOffset)

    const text = buffer.toString('utf-8')
    const lines = text.split('\n')

    // Remove trailing empty line
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }

    return { lines, byteOffset: fileSize }
  } finally {
    await fsClose(fd)
  }
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
