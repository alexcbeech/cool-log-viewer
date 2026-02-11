import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs'
import { dirname } from 'path'
import { getSessionFilePath } from '../utils/paths'
import { sessionSchema, type SessionData } from './schemas'
import { migrateSession } from './migrations'
import { logger } from '../utils/logger'

export class SessionStore {
  private filePath: string

  constructor() {
    this.filePath = getSessionFilePath()
  }

  load(): SessionData {
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const data = JSON.parse(raw)
      const migrated = migrateSession(data)
      return sessionSchema.parse(migrated)
    } catch {
      logger.info('No session file found or invalid, using defaults')
      return sessionSchema.parse({})
    }
  }

  save(data: unknown): void {
    try {
      const validated = sessionSchema.parse(data)
      const dir = dirname(this.filePath)
      mkdirSync(dir, { recursive: true })

      const tempPath = this.filePath + '.tmp'
      writeFileSync(tempPath, JSON.stringify(validated, null, 2))
      renameSync(tempPath, this.filePath)
    } catch (error) {
      logger.error('Failed to save session:', error)
    }
  }
}
