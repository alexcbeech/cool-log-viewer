export interface FileOpenDialogResult {
  canceled: boolean
  filePaths: string[]
}

export interface FileLinesPayload {
  paneId: string
  lines: string[]
  isInitial: boolean
}

export interface FileErrorPayload {
  paneId: string
  error: string
}

export interface FileTruncatedPayload {
  paneId: string
}
