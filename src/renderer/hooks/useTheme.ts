import { useEffect } from 'react'
import { useConfigStore } from '../stores/config-store'
import { getRowHeight } from '../lib/constants'
import type { ThemeMode } from '../types/config'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode: ThemeMode): void {
  const resolved = mode === 'auto' ? getSystemTheme() : mode
  const html = document.documentElement
  if (resolved === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

export function useTheme(): void {
  const theme = useConfigStore((s) => s.config.theme)
  const fontSize = useConfigStore((s) => s.config.fontSize)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (): void => applyTheme('auto')
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  // Sync font size to CSS variables
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--log-font-size', `${fontSize}px`)
    root.style.setProperty('--log-line-height', `${getRowHeight(fontSize)}px`)
  }, [fontSize])
}
