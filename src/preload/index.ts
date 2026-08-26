import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { ElectronAPI } from '@shared/electron-api'

function createListener(channel: string) {
  return (callback: (...args: unknown[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => {
      callback(...args)
    }
    ipcRenderer.on(channel, handler)
    return () => {
      ipcRenderer.removeListener(channel, handler)
    }
  }
}

const api: ElectronAPI = {
  openFileDialog: () => ipcRenderer.invoke(IPC.FILE_OPEN_DIALOG),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  startTail: (paneId, filePath) => ipcRenderer.invoke(IPC.FILE_START_TAIL, paneId, filePath),
  stopTail: (paneId) => ipcRenderer.invoke(IPC.FILE_STOP_TAIL, paneId),
  stopAllTails: () => ipcRenderer.invoke(IPC.FILE_STOP_ALL),

  onFileLines: createListener(IPC.FILE_LINES) as ElectronAPI['onFileLines'],
  onFileError: createListener(IPC.FILE_ERROR) as ElectronAPI['onFileError'],
  onFileTruncated: createListener(IPC.FILE_TRUNCATED) as ElectronAPI['onFileTruncated'],

  loadConfig: () => ipcRenderer.invoke(IPC.CONFIG_LOAD),
  saveConfig: (config) => ipcRenderer.invoke(IPC.CONFIG_SAVE, config),
  loadSession: () => ipcRenderer.invoke(IPC.SESSION_LOAD),
  saveSession: (session) => ipcRenderer.invoke(IPC.SESSION_SAVE, session),

  onMenuOpenFile: createListener(IPC.MENU_OPEN_FILE) as ElectronAPI['onMenuOpenFile'],
  onMenuClosePane: createListener(IPC.MENU_CLOSE_PANE) as ElectronAPI['onMenuClosePane'],
  onMenuFind: createListener(IPC.MENU_FIND) as ElectronAPI['onMenuFind'],
  onMenuSplitHorizontal: createListener(
    IPC.MENU_SPLIT_HORIZONTAL
  ) as ElectronAPI['onMenuSplitHorizontal'],
  onMenuSplitVertical: createListener(
    IPC.MENU_SPLIT_VERTICAL
  ) as ElectronAPI['onMenuSplitVertical'],
  onMenuToggleFollow: createListener(IPC.MENU_TOGGLE_FOLLOW) as ElectronAPI['onMenuToggleFollow'],
  onMenuToggleTheme: createListener(IPC.MENU_TOGGLE_THEME) as ElectronAPI['onMenuToggleTheme'],
  onMenuNextPane: createListener(IPC.MENU_NEXT_PANE) as ElectronAPI['onMenuNextPane'],
  onMenuIncreaseFontSize: createListener(
    IPC.MENU_INCREASE_FONT_SIZE
  ) as ElectronAPI['onMenuIncreaseFontSize'],
  onMenuDecreaseFontSize: createListener(
    IPC.MENU_DECREASE_FONT_SIZE
  ) as ElectronAPI['onMenuDecreaseFontSize']
}

contextBridge.exposeInMainWorld('electronAPI', api)
