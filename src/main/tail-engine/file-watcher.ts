import chokidar, { type FSWatcher } from 'chokidar'
import { stat } from 'fs/promises'
import { WATCHER_DEBOUNCE_MS, WATCHER_POLL_MS } from '@shared/constants'
import { logger } from '../utils/logger'

export type WatcherCallback = (eventType: 'change' | 'unlink') => void | Promise<void>

interface FileSnapshot {
  identity: string
  size: number
  modifiedAt: number
}

export class FileWatcher {
  private watcher: FSWatcher | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private snapshotTimer: ReturnType<typeof setInterval> | null = null
  private snapshot: FileSnapshot | null = null
  private snapshotCheckPending = false
  private generation = 0

  async start(filePath: string, callback: WatcherCallback): Promise<void> {
    await this.stop()

    const watcher = chokidar.watch(filePath, {
      persistent: true,
      usePolling: true, // Enable polling for reliable log tailing across all platforms
      interval: WATCHER_POLL_MS,
      awaitWriteFinish: {
        stabilityThreshold: 100, // Wait 100ms after last write to ensure file is stable
        pollInterval: 50
      },
      ignoreInitial: true
    })
    this.watcher = watcher

    watcher.on('change', () => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      this.debounceTimer = setTimeout(() => {
        void callback('change')
      }, WATCHER_DEBOUNCE_MS)
    })

    watcher.on('unlink', () => {
      logger.info(`File unlinked: ${filePath}`)
      void callback('unlink')
    })

    await new Promise<void>((resolve, reject) => {
      let ready = false
      watcher.on('error', (error: unknown) => {
        if (ready) {
          logger.error(`File watcher error for ${filePath}:`, error)
        } else {
          reject(error)
        }
      })
      watcher.once('ready', () => {
        ready = true
        resolve()
      })
    })

    const generation = this.generation
    this.snapshot = await getFileSnapshot(filePath)
    this.snapshotTimer = setInterval(() => {
      if (this.snapshotCheckPending) return
      this.snapshotCheckPending = true
      void this.checkSnapshot(filePath, callback, generation)
        .catch((error: unknown) => {
          logger.error(`File identity check failed for ${filePath}:`, error)
        })
        .finally(() => {
          this.snapshotCheckPending = false
        })
    }, WATCHER_POLL_MS)

    logger.info(`Started watching: ${filePath} (polling mode)`)
  }

  async stop(): Promise<void> {
    this.generation++
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer)
      this.snapshotTimer = null
    }
    this.snapshot = null
    if (this.watcher) {
      const watcher = this.watcher
      this.watcher = null
      await watcher.close()
    }
  }

  private async checkSnapshot(
    filePath: string,
    callback: WatcherCallback,
    generation: number
  ): Promise<void> {
    const previous = this.snapshot
    const current = await getFileSnapshot(filePath)
    if (generation !== this.generation) return

    this.snapshot = current
    if (!previous && !current) return

    if (!previous || !current || previous.identity !== current.identity) {
      logger.info(`File identity changed: ${filePath}`)
      await callback('unlink')
      return
    }

    if (previous.size !== current.size || previous.modifiedAt !== current.modifiedAt) {
      await callback('change')
    }
  }
}

async function getFileSnapshot(filePath: string): Promise<FileSnapshot | null> {
  try {
    const stats = await stat(filePath)
    return {
      identity: `${stats.dev}:${stats.ino}:${stats.birthtimeMs}`,
      size: stats.size,
      modifiedAt: stats.mtimeMs
    }
  } catch (error) {
    if (isMissingFileError(error)) return null
    throw error
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'ENOENT' || error.code === 'ENOTDIR')
  )
}
