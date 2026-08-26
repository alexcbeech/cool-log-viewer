import type { ConfigData, SessionData } from './schemas'

export function migrateConfig(data: unknown): Partial<ConfigData> {
  if (!data || typeof data !== 'object') return {}
  const obj = data as Record<string, unknown>
  const _version = typeof obj.version === 'number' ? obj.version : 0

  // Future migrations go here
  // if (version < 2) { ... }

  return obj as Partial<ConfigData>
}

export function migrateSession(data: unknown): Partial<SessionData> {
  if (!data || typeof data !== 'object') return {}
  const obj = data as Record<string, unknown>
  const _version = typeof obj.version === 'number' ? obj.version : 0

  // Future migrations go here

  return obj as Partial<SessionData>
}
