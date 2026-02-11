export interface LogLine {
  lineNumber: number
  text: string
}

export interface LineChunk {
  paneId: string
  lines: string[]
  isInitial: boolean
}
