import { INITIAL_CHUNK_SIZE, BATCH_INTERVAL_MS } from '@shared/constants'
import { readFromOffset, readLastLines } from './file-reader'
import { FileWatcher } from './file-watcher'
import { LineAssembler } from './line-assembler'
import { logger } from '../utils/logger'
import type { LineCallback } from './types'

type ErrorCallback = (error: Error) => void

interface TailSession {
  paneId: string
  filePath: string
  watcher: FileWatcher
  lineAssembler: LineAssembler
  lastByteOffset: number
  callback: LineCallback
  errorCallback: ErrorCallback
  batchBuffer: string[]
  batchReplaceLast: boolean
  batchTimer: ReturnType<typeof setTimeout> | null
  changeChain: Promise<void>
  reopenTimer: ReturnType<typeof setTimeout> | null
  reopenAttempt: number
}

export class TailEngine {
  private sessions = new Map<string, TailSession>()

  async startTail(
    paneId: string,
    filePath: string,
    callback: LineCallback,
    errorCallback: ErrorCallback = () => undefined
  ): Promise<void> {
    await this.stopTail(paneId)

    const session: TailSession = {
      paneId,
      filePath,
      watcher: new FileWatcher(),
      lineAssembler: new LineAssembler(),
      lastByteOffset: 0,
      callback,
      errorCallback,
      batchBuffer: [],
      batchReplaceLast: false,
      batchTimer: null,
      changeChain: Promise.resolve(),
      reopenTimer: null,
      reopenAttempt: 0
    }

    this.sessions.set(paneId, session)

    try {
      await this.loadInitialContent(session)
      if (!this.isCurrent(session)) return

      await this.startWatcher(session)
      if (!this.isCurrent(session)) {
        await session.watcher.stop()
        return
      }

      logger.info(`Started tailing: ${filePath}`)
    } catch (error) {
      if (this.isCurrent(session)) this.sessions.delete(paneId)
      await session.watcher.stop()
      const normalizedError = toError(error)
      logger.error(`Failed to start tail for ${filePath}:`, normalizedError)
      throw normalizedError
    }
  }

  async stopTail(paneId: string): Promise<void> {
    const session = this.sessions.get(paneId)
    if (!session) return

    this.sessions.delete(paneId)
    if (session.reopenTimer) clearTimeout(session.reopenTimer)
    if (session.batchTimer) clearTimeout(session.batchTimer)
    this.flushBatch(session)
    await session.watcher.stop()
    logger.info(`Stopped tailing pane: ${paneId}`)
  }

  async stopAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((paneId) => this.stopTail(paneId)))
  }

  private async startWatcher(session: TailSession): Promise<void> {
    await session.watcher.start(session.filePath, async (eventType) => {
      if (!this.isCurrent(session)) return
      if (eventType === 'unlink') {
        logger.info(`File deleted/rotated: ${session.filePath}`)
        this.scheduleReopen(session)
        return
      }
      await this.enqueueFileChange(session)
    })
  }

  private enqueueFileChange(session: TailSession): Promise<void> {
    session.changeChain = session.changeChain
      .then(async () => {
        if (this.isCurrent(session)) await this.onFileChange(session)
      })
      .catch((error: unknown) => {
        this.reportError(session, error)
      })
    return session.changeChain
  }

  private async onFileChange(session: TailSession): Promise<void> {
    let hasMore = true
    while (hasMore && this.isCurrent(session)) {
      const result = await readFromOffset(session.filePath, session.lastByteOffset)
      if (!this.isCurrent(session)) return

      if (result.byteOffset === -1) {
        logger.info(`File truncated: ${session.filePath}`)
        await this.loadInitialContent(session)
        return
      }

      session.lastByteOffset = result.byteOffset
      if (result.content.length === 0) return

      const update = session.lineAssembler.push(result.content)
      if (update.lines.length > 0) {
        this.queueBatch(session, update.lines, update.replaceLast)
      }

      hasMore = result.hasMore
    }
  }

  private async loadInitialContent(session: TailSession): Promise<void> {
    const result = await readLastLines(session.filePath, INITIAL_CHUNK_SIZE)
    if (!this.isCurrent(session)) return

    session.lastByteOffset = result.byteOffset
    session.lineAssembler.initialize(
      result.hasTrailingPartial ? (result.lines[result.lines.length - 1] ?? '') : null
    )

    if (result.lines.length === 0) {
      session.callback([], true)
      return
    }

    const chunkSize = 1000
    for (let i = 0; i < result.lines.length; i += chunkSize) {
      session.callback(result.lines.slice(i, i + chunkSize), i === 0)
    }
  }

  private queueBatch(session: TailSession, lines: string[], replaceLast: boolean): void {
    if (replaceLast && session.batchBuffer.length > 0) {
      session.batchBuffer.splice(session.batchBuffer.length - 1, 1, ...lines)
    } else {
      if (replaceLast) session.batchReplaceLast = true
      session.batchBuffer.push(...lines)
    }

    if (!session.batchTimer) {
      session.batchTimer = setTimeout(() => {
        session.batchTimer = null
        this.flushBatch(session)
      }, BATCH_INTERVAL_MS)
    }
  }

  private flushBatch(session: TailSession): void {
    if (session.batchBuffer.length === 0) return
    session.callback(session.batchBuffer, false, session.batchReplaceLast)
    session.batchBuffer = []
    session.batchReplaceLast = false
  }

  private scheduleReopen(session: TailSession): void {
    if (!this.isCurrent(session) || session.reopenTimer) return

    const delay = Math.min(500 * 2 ** session.reopenAttempt, 5000)
    session.reopenTimer = setTimeout(() => {
      session.reopenTimer = null
      void this.tryReopen(session)
    }, delay)
  }

  private async tryReopen(session: TailSession): Promise<void> {
    if (!this.isCurrent(session)) return

    try {
      await this.loadInitialContent(session)
      if (!this.isCurrent(session)) return
      await this.startWatcher(session)
      session.reopenAttempt = 0
      logger.info(`Reopened rotated file: ${session.filePath}`)
    } catch (error) {
      if (!this.isCurrent(session)) return
      session.reopenAttempt++
      logger.warn(`Could not reopen file: ${session.filePath}; retrying`)
      this.scheduleReopen(session)
      if (session.reopenAttempt === 1) this.reportError(session, error)
    }
  }

  private reportError(session: TailSession, error: unknown): void {
    const normalizedError = toError(error)
    logger.error(`Tail error for ${session.filePath}:`, normalizedError)
    session.errorCallback(normalizedError)
  }

  private isCurrent(session: TailSession): boolean {
    return this.sessions.get(session.paneId) === session
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
