import { create } from 'zustand'
import type { AppConfig, ThemeMode } from '../types/config'
import { DEFAULT_CONFIG } from '../types/config'

const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 32
const FONT_SIZE_STEP = 1

interface ConfigStore {
  config: AppConfig
  isLoaded: boolean

  setConfig: (config: AppConfig) => void
  setTheme: (theme: ThemeMode) => void
  cycleTheme: () => void
  setFontSize: (size: number) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  setMaxLines: (max: number) => void
}

const themeOrder: ThemeMode[] = ['light', 'dark', 'auto']

export const useConfigStore = create<ConfigStore>((set) => ({
  config: DEFAULT_CONFIG,
  isLoaded: false,

  setConfig: (config) => set({ config, isLoaded: true }),

  setTheme: (theme) => set((state) => ({ config: { ...state.config, theme } })),

  cycleTheme: () =>
    set((state) => {
      const currentIndex = themeOrder.indexOf(state.config.theme)
      const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]
      return { config: { ...state.config, theme: nextTheme } }
    }),

  setFontSize: (fontSize) =>
    set((state) => ({
      config: {
        ...state.config,
        fontSize: Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize))
      }
    })),

  increaseFontSize: () =>
    set((state) => ({
      config: {
        ...state.config,
        fontSize: Math.min(MAX_FONT_SIZE, state.config.fontSize + FONT_SIZE_STEP)
      }
    })),

  decreaseFontSize: () =>
    set((state) => ({
      config: {
        ...state.config,
        fontSize: Math.max(MIN_FONT_SIZE, state.config.fontSize - FONT_SIZE_STEP)
      }
    })),

  setMaxLines: (maxLines) => set((state) => ({ config: { ...state.config, maxLines } }))
}))
