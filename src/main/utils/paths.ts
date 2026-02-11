import { app } from 'electron'
import { join } from 'path'

export function getConfigPath(): string {
  return join(app.getPath('userData'))
}

export function getConfigFilePath(): string {
  return join(getConfigPath(), 'config.json')
}

export function getSessionFilePath(): string {
  return join(getConfigPath(), 'session.json')
}
