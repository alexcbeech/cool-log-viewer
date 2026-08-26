import type {
  FileErrorPayload,
  FileLinesPayload,
  FileOpenDialogResult,
  FileTruncatedPayload
} from './ipc-types'

export interface ElectronAPI {
  openFileDialog: () => Promise<FileOpenDialogResult>
  getPathForFile: (file: File) => string
  startTail: (paneId: string, filePath: string) => Promise<void>
  stopTail: (paneId: string) => Promise<void>
  stopAllTails: () => Promise<void>

  onFileLines: (callback: (payload: FileLinesPayload) => void) => () => void
  onFileError: (callback: (payload: FileErrorPayload) => void) => () => void
  onFileTruncated: (callback: (payload: FileTruncatedPayload) => void) => () => void

  loadConfig: () => Promise<unknown>
  saveConfig: (config: unknown) => Promise<void>
  loadSession: () => Promise<unknown>
  saveSession: (session: unknown) => Promise<void>

  onMenuOpenFile: (callback: () => void) => () => void
  onMenuClosePane: (callback: () => void) => () => void
  onMenuFind: (callback: () => void) => () => void
  onMenuSplitHorizontal: (callback: () => void) => () => void
  onMenuSplitVertical: (callback: () => void) => () => void
  onMenuToggleFollow: (callback: () => void) => () => void
  onMenuToggleTheme: (callback: () => void) => () => void
  onMenuNextPane: (callback: () => void) => () => void
  onMenuIncreaseFontSize: (callback: () => void) => () => void
  onMenuDecreaseFontSize: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
