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
      usePolling: true, // Enable polling for reliable log tailing across all platforms
      interval: WATCHER_POLL_MS,
      awaitWriteFinish: {
        stabilityThreshold: 100, // Wait 100ms after last write to ensure file is stable
        pollInterval: 50
      },
      ignoreInitial: true
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
