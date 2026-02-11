export interface TailSession {
  paneId: string
  filePath: string
  lastByteOffset: number
  isActive: boolean
}

export type LineCallback = (lines: string[], isInitial: boolean) => void
