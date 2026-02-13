import type { FileOpenDialogResult, FileLinesPayload, FileErrorPayload, FileTruncatedPayload } from '@shared/ipc-types'

export interface ElectronAPI {
  // File operations
  openFileDialog: () => Promise<FileOpenDialogResult>
  startTail: (paneId: string, filePath: string) => Promise<void>
  stopTail: (paneId: string) => Promise<void>
  stopAllTails: () => Promise<void>

  // File events (main -> renderer)
  onFileLines: (callback: (payload: FileLinesPayload) => void) => () => void
  onFileError: (callback: (payload: FileErrorPayload) => void) => () => void
  onFileTruncated: (callback: (payload: FileTruncatedPayload) => void) => () => void

  // Config & session
  loadConfig: () => Promise<unknown>
  saveConfig: (config: unknown) => Promise<void>
  loadSession: () => Promise<unknown>
  saveSession: (session: unknown) => Promise<void>

  // Menu events (main -> renderer)
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
