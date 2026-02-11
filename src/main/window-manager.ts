import { screen } from 'electron'
import { getConfigPath } from './utils/paths'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export class WindowManager {
  private boundsPath: string

  constructor() {
    this.boundsPath = join(getConfigPath(), 'window-bounds.json')
  }

  getSavedBounds(): WindowBounds | null {
    try {
      const data = readFileSync(this.boundsPath, 'utf-8')
      const bounds: WindowBounds = JSON.parse(data)
      if (this.isOnScreen(bounds)) {
        return bounds
      }
      return null
    } catch {
      return null
    }
  }

  saveBounds(bounds: WindowBounds): void {
    try {
      mkdirSync(dirname(this.boundsPath), { recursive: true })
      writeFileSync(this.boundsPath, JSON.stringify(bounds, null, 2))
    } catch {
      // Silently fail — non-critical
    }
  }

  private isOnScreen(bounds: WindowBounds): boolean {
    const displays = screen.getAllDisplays()
    return displays.some((display) => {
      const { x, y, width, height } = display.workArea
      return (
        bounds.x >= x - 100 &&
        bounds.y >= y - 100 &&
        bounds.x + bounds.width <= x + width + 100 &&
        bounds.y + bounds.height <= y + height + 100
      )
    })
  }
}
