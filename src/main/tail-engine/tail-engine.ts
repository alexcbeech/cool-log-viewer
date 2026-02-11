import { readLastLines, readFromOffset } from './file-reader'
import { FileWatcher } from './file-watcher'
import { LineBuffer } from './line-buffer'
import { BATCH_INTERVAL_MS, INITIAL_CHUNK_SIZE } from '@shared/constants'
import { logger } from '../utils/logger'
import type { LineCallback } from './types'

interface TailSession {
  paneId: string
  filePath: string
  watcher: FileWatcher
  lineBuffer: LineBuffer
  lastByteOffset: number
  callback: LineCallback
  batchBuffer: string[]
  batchTimer: ReturnType<typeof setTimeout> | null
}

export class TailEngine {
  private sessions: Map<string, TailSession> = new Map()

  async startTail(paneId: string, filePath: string, callback: LineCallback): Promise<void> {
    // Stop existing session for this pane
    this.stopTail(paneId)

    const watcher = new FileWatcher()
    const lineBuffer = new LineBuffer()

    const session: TailSession = {
      paneId,
      filePath,
      watcher,
      lineBuffer,
      lastByteOffset: 0,
      callback,
      batchBuffer: [],
      batchTimer: null
    }

    this.sessions.set(paneId, session)

    try {
      // Initial read: last N lines from end of file
      const result = await readLastLines(filePath, INITIAL_CHUNK_SIZE)
      session.lastByteOffset = result.byteOffset
      lineBuffer.push(result.lines)

      // Send initial lines in chunks for progressive rendering
      const chunkSize = 1000
      for (let i = 0; i < result.lines.length; i += chunkSize) {
        const chunk = result.lines.slice(i, i + chunkSize)
        callback(chunk, i === 0)
      }

      // Start watching for changes
      await watcher.start(filePath, async (eventType) => {
        if (eventType === 'unlink') {
          logger.info(`File deleted/rotated: ${filePath}`)
          // File was deleted or rotated — try to reopen
          setTimeout(() => this.tryReopen(paneId), 500)
          return
        }

        await this.onFileChange(paneId)
      })

      logger.info(`Started tailing: ${filePath} (${result.lines.length} lines loaded)`)
    } catch (error) {
      logger.error(`Failed to start tail for ${filePath}:`, error)
      this.sessions.delete(paneId)
    }
  }

  stopTail(paneId: string): void {
    const session = this.sessions.get(paneId)
    if (!session) return

    session.watcher.stop()
    if (session.batchTimer) {
      clearTimeout(session.batchTimer)
    }
    // Flush remaining batch
    if (session.batchBuffer.length > 0) {
      session.callback(session.batchBuffer, false)
    }
    this.sessions.delete(paneId)
    logger.info(`Stopped tailing pane: ${paneId}`)
  }

  stopAll(): void {
    for (const paneId of this.sessions.keys()) {
      this.stopTail(paneId)
    }
  }

  private async onFileChange(paneId: string): Promise<void> {
    const session = this.sessions.get(paneId)
    if (!session) return

    try {
      const result = await readFromOffset(session.filePath, session.lastByteOffset)

      // Truncation detected
      if (result.byteOffset === -1) {
        logger.info(`File truncated: ${session.filePath}`)
        session.lineBuffer.clear()
        session.lastByteOffset = 0
        // Re-read from beginning
        const fresh = await readLastLines(session.filePath, INITIAL_CHUNK_SIZE)
        session.lastByteOffset = fresh.byteOffset
        session.lineBuffer.push(fresh.lines)
        session.callback(fresh.lines, true)
        return
      }

      if (result.lines.length === 0) return

      session.lastByteOffset = result.byteOffset
      session.lineBuffer.push(result.lines)

      // Batch lines for BATCH_INTERVAL_MS before sending
      session.batchBuffer.push(...result.lines)

      if (!session.batchTimer) {
        session.batchTimer = setTimeout(() => {
          if (session.batchBuffer.length > 0) {
            session.callback(session.batchBuffer, false)
            session.batchBuffer = []
          }
          session.batchTimer = null
        }, BATCH_INTERVAL_MS)
      }
    } catch (error) {
      logger.error(`Error reading file change for ${session.filePath}:`, error)
    }
  }

  private async tryReopen(paneId: string): Promise<void> {
    const session = this.sessions.get(paneId)
    if (!session) return

    try {
      // Try to re-read the file (it may have been recreated)
      const result = await readLastLines(session.filePath, INITIAL_CHUNK_SIZE)
      session.lastByteOffset = result.byteOffset
      session.lineBuffer.clear()
      session.lineBuffer.push(result.lines)
      session.callback(result.lines, true)

      // Restart watcher
      await session.watcher.start(session.filePath, async (eventType) => {
        if (eventType === 'unlink') {
          setTimeout(() => this.tryReopen(paneId), 500)
          return
        }
        await this.onFileChange(paneId)
      })

      logger.info(`Reopened rotated file: ${session.filePath}`)
    } catch {
      logger.warn(`Could not reopen file: ${session.filePath}`)
    }
  }
}
