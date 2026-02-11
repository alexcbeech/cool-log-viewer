import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { TailEngine } from './tail-engine/tail-engine'

const tailEngine = new TailEngine()

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.FILE_OPEN_DIALOG, async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return { canceled: true, filePaths: [] }

    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Log Files', extensions: ['log', 'txt', 'out'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return { canceled: result.canceled, filePaths: result.filePaths }
  })

  ipcMain.handle(IPC.FILE_START_TAIL, async (_event, paneId: string, filePath: string) => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return

    tailEngine.startTail(paneId, filePath, (lines, isInitial) => {
      try {
        if (window.isDestroyed()) return
        window.webContents.send(IPC.FILE_LINES, { paneId, lines, isInitial })
      } catch {
        // Window may have been destroyed between check and send
      }
    })
  })

  ipcMain.handle(IPC.FILE_STOP_TAIL, async (_event, paneId: string) => {
    tailEngine.stopTail(paneId)
  })

  ipcMain.handle(IPC.FILE_STOP_ALL, async () => {
    tailEngine.stopAll()
  })

  ipcMain.handle(IPC.CONFIG_LOAD, async () => {
    const { ConfigStore } = await import('./persistence/config-store')
    const store = new ConfigStore()
    return store.load()
  })

  ipcMain.handle(IPC.CONFIG_SAVE, async (_event, config: unknown) => {
    const { ConfigStore } = await import('./persistence/config-store')
    const store = new ConfigStore()
    store.save(config)
  })

  ipcMain.handle(IPC.SESSION_LOAD, async () => {
    const { SessionStore } = await import('./persistence/session-store')
    const store = new SessionStore()
    return store.load()
  })

  ipcMain.handle(IPC.SESSION_SAVE, async (_event, session: unknown) => {
    const { SessionStore } = await import('./persistence/session-store')
    const store = new SessionStore()
    store.save(session)
  })
}
