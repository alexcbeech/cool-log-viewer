import { create } from 'zustand'
import type { AppConfig, ThemeMode } from '../types/config'
import { DEFAULT_CONFIG } from '../types/config'

interface ConfigStore {
  config: AppConfig
  isLoaded: boolean

  setConfig: (config: AppConfig) => void
  setTheme: (theme: ThemeMode) => void
  cycleTheme: () => void
  setFontSize: (size: number) => void
  setMaxLines: (max: number) => void
}

const themeOrder: ThemeMode[] = ['light', 'dark', 'auto']

export const useConfigStore = create<ConfigStore>((set) => ({
  config: DEFAULT_CONFIG,
  isLoaded: false,

  setConfig: (config) => set({ config, isLoaded: true }),

  setTheme: (theme) =>
    set((state) => ({ config: { ...state.config, theme } })),

  cycleTheme: () =>
    set((state) => {
      const currentIndex = themeOrder.indexOf(state.config.theme)
      const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]
      return { config: { ...state.config, theme: nextTheme } }
    }),

  setFontSize: (fontSize) =>
    set((state) => ({ config: { ...state.config, fontSize } })),

  setMaxLines: (maxLines) =>
    set((state) => ({ config: { ...state.config, maxLines } }))
}))
