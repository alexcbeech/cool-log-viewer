import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs'
import { dirname, join } from 'path'
import { getConfigFilePath } from '../utils/paths'
import { configSchema, type ConfigData } from './schemas'
import { migrateConfig } from './migrations'
import { logger } from '../utils/logger'

export class ConfigStore {
  private filePath: string

  constructor() {
    this.filePath = getConfigFilePath()
  }

  load(): ConfigData {
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const data = JSON.parse(raw)
      const migrated = migrateConfig(data)
      return configSchema.parse(migrated)
    } catch {
      logger.info('No config file found or invalid, using defaults')
      return configSchema.parse({})
    }
  }

  save(data: unknown): void {
    try {
      const validated = configSchema.parse(data)
      const dir = dirname(this.filePath)
      mkdirSync(dir, { recursive: true })

      // Atomic write: write to temp, then rename
      const tempPath = this.filePath + '.tmp'
      writeFileSync(tempPath, JSON.stringify(validated, null, 2))
      renameSync(tempPath, this.filePath)
    } catch (error) {
      logger.error('Failed to save config:', error)
    }
  }
}
