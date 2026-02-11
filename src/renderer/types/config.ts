export type ThemeMode = 'light' | 'dark' | 'auto'

export interface AppConfig {
  theme: ThemeMode
  fontSize: number
  fontFamily: string
  maxLines: number
}

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'auto',
  fontSize: 13,
  fontFamily: "'Cascadia Code', 'Consolas', 'Courier New', monospace",
  maxLines: 100_000
}
