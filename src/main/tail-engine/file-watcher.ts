import chokidar, { type FSWatcher } from 'chokidar'
import { WATCHER_DEBOUNCE_MS, WATCHER_POLL_MS } from '@shared/constants'
import { logger } from '../utils/logger'

export type WatcherCallback = (eventType: 'change' | 'unlink') => void | Promise<void>

export class FileWatcher {
  private watcher: FSWatcher | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

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

    logger.info(`Started watching: ${filePath} (polling mode)`)
  }

  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.watcher) {
      const watcher = this.watcher
      this.watcher = null
      await watcher.close()
    }
  }
}
