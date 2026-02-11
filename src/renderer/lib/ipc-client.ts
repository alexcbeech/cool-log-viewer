import type { ElectronAPI } from '../../preload/api'

function getApi(): ElectronAPI {
  return window.electronAPI
}

export const ipcClient = {
  openFileDialog: () => getApi().openFileDialog(),
  startTail: (paneId: string, filePath: string) => getApi().startTail(paneId, filePath),
  stopTail: (paneId: string) => getApi().stopTail(paneId),
  stopAllTails: () => getApi().stopAllTails(),

  onFileLines: (cb: Parameters<ElectronAPI['onFileLines']>[0]) => getApi().onFileLines(cb),
  onFileError: (cb: Parameters<ElectronAPI['onFileError']>[0]) => getApi().onFileError(cb),
  onFileTruncated: (cb: Parameters<ElectronAPI['onFileTruncated']>[0]) =>
    getApi().onFileTruncated(cb),

  loadConfig: () => getApi().loadConfig(),
  saveConfig: (config: unknown) => getApi().saveConfig(config),
  loadSession: () => getApi().loadSession(),
  saveSession: (session: unknown) => getApi().saveSession(session),

  onMenuOpenFile: (cb: () => void) => getApi().onMenuOpenFile(cb),
  onMenuClosePane: (cb: () => void) => getApi().onMenuClosePane(cb),
  onMenuFind: (cb: () => void) => getApi().onMenuFind(cb),
  onMenuSplitHorizontal: (cb: () => void) => getApi().onMenuSplitHorizontal(cb),
  onMenuSplitVertical: (cb: () => void) => getApi().onMenuSplitVertical(cb),
  onMenuToggleFollow: (cb: () => void) => getApi().onMenuToggleFollow(cb),
  onMenuToggleTheme: (cb: () => void) => getApi().onMenuToggleTheme(cb),
  onMenuNextPane: (cb: () => void) => getApi().onMenuNextPane(cb)
}
