import { MAX_LINES } from '@shared/constants'

/**
 * Ring buffer for log lines. Keeps at most maxLines lines in memory.
 */
export class LineBuffer {
  private buffer: string[] = []
  private maxLines: number

  constructor(maxLines: number = MAX_LINES) {
    this.maxLines = maxLines
  }

  push(lines: string[]): void {
    this.buffer.push(...lines)
    if (this.buffer.length > this.maxLines) {
      this.buffer = this.buffer.slice(this.buffer.length - this.maxLines)
    }
  }

  clear(): void {
    this.buffer = []
  }

  getAll(): string[] {
    return this.buffer
  }

  get length(): number {
    return this.buffer.length
  }
}
