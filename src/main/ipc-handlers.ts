import { ipcMain, dialog, BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { fileURLToPath } from 'url'
import { isAbsolute, relative, resolve } from 'path'
import { IPC } from '@shared/ipc-channels'
import { TailEngine } from './tail-engine/tail-engine'

const tailEngine = new TailEngine()

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.FILE_OPEN_DIALOG, async (event) => {
    assertTrustedSender(event)
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

  ipcMain.handle(IPC.FILE_START_TAIL, async (event, paneId: string, filePath: string) => {
    assertTrustedSender(event)
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return

    const sendError = (error: Error): void => {
      try {
        if (window.isDestroyed()) return
        window.webContents.send(IPC.FILE_ERROR, { paneId, error: error.message })
      } catch {
        // Window may have been destroyed between check and send
      }
    }

    try {
      await tailEngine.startTail(
        paneId,
        filePath,
        (lines, isInitial, replaceLast = false) => {
          try {
            if (window.isDestroyed()) return
            window.webContents.send(IPC.FILE_LINES, { paneId, lines, isInitial, replaceLast })
          } catch {
            // Window may have been destroyed between check and send
          }
        },
        sendError
      )
    } catch (error) {
      sendError(error instanceof Error ? error : new Error(String(error)))
    }
  })

  ipcMain.handle(IPC.FILE_STOP_TAIL, async (event, paneId: string) => {
    assertTrustedSender(event)
    await tailEngine.stopTail(paneId)
  })

  ipcMain.handle(IPC.FILE_STOP_ALL, async (event) => {
    assertTrustedSender(event)
    await tailEngine.stopAll()
  })

  ipcMain.handle(IPC.CONFIG_LOAD, async (event) => {
    assertTrustedSender(event)
    const { ConfigStore } = await import('./persistence/config-store')
    const store = new ConfigStore()
    return store.load()
  })

  ipcMain.handle(IPC.CONFIG_SAVE, async (event, config: unknown) => {
    assertTrustedSender(event)
    const { ConfigStore } = await import('./persistence/config-store')
    const store = new ConfigStore()
    store.save(config)
  })

  ipcMain.handle(IPC.SESSION_LOAD, async (event) => {
    assertTrustedSender(event)
    const { SessionStore } = await import('./persistence/session-store')
    const store = new SessionStore()
    return store.load()
  })

  ipcMain.handle(IPC.SESSION_SAVE, async (event, session: unknown) => {
    assertTrustedSender(event)
    const { SessionStore } = await import('./persistence/session-store')
    const store = new SessionStore()
    store.save(session)
  })
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  const senderUrl = event.senderFrame?.url
  if (!senderUrl) throw new Error('Rejected IPC from an unknown sender')

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    if (new URL(senderUrl).origin === new URL(devUrl).origin) return
    throw new Error('Rejected IPC from an untrusted development origin')
  }

  const url = new URL(senderUrl)
  if (url.protocol !== 'file:') throw new Error('Rejected IPC from an untrusted protocol')

  const rendererRoot = resolve(__dirname, '../renderer')
  const senderPath = fileURLToPath(url)
  const relativePath = relative(rendererRoot, senderPath)
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error('Rejected IPC from outside the renderer bundle')
  }
}
