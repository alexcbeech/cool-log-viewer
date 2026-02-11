import chokidar from 'chokidar'
import { WATCHER_DEBOUNCE_MS, WATCHER_POLL_MS } from '@shared/constants'

export type WatcherCallback = (eventType: 'change' | 'unlink') => void

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  async start(filePath: string, callback: WatcherCallback): Promise<void> {
    this.stop()

    this.watcher = chokidar.watch(filePath, {
      persistent: true,
      usePolling: false,
      awaitWriteFinish: false,
      ignoreInitial: true,
      // Fallback to polling if native watching fails
      interval: WATCHER_POLL_MS
    })

    this.watcher.on('change', () => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      this.debounceTimer = setTimeout(() => {
        callback('change')
      }, WATCHER_DEBOUNCE_MS)
    })

    this.watcher.on('unlink', () => {
      callback('unlink')
    })
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
}
