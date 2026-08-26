import { StringDecoder } from 'string_decoder'

export interface LineUpdate {
  lines: string[]
  replaceLast: boolean
}

export class LineAssembler {
  private decoder = new StringDecoder('utf8')
  private pendingLine = ''
  private partialDisplayed = false

  initialize(trailingPartial: string | null): void {
    this.decoder = new StringDecoder('utf8')
    this.pendingLine = trailingPartial ?? ''
    this.partialDisplayed = trailingPartial !== null
  }

  reset(): void {
    this.initialize(null)
  }

  push(content: Buffer): LineUpdate {
    const decoded = this.decoder.write(content)
    if (decoded.length === 0) return { lines: [], replaceLast: false }

    const parts = (this.pendingLine + decoded).split('\n')
    this.pendingLine = parts.pop() ?? ''

    const lines = parts.map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line))
    if (this.pendingLine.length > 0) lines.push(this.pendingLine)

    const replaceLast = this.partialDisplayed && lines.length > 0
    this.partialDisplayed = this.pendingLine.length > 0
    return { lines, replaceLast }
  }
}
