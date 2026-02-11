import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '../common/Button'
import { Tooltip } from '../common/Tooltip'
import { useConfigStore } from '../../stores/config-store'
import type { ThemeMode } from '../../types/config'

const THEME_ICONS: Record<ThemeMode, React.ReactNode> = {
  light: <Sun size={14} />,
  dark: <Moon size={14} />,
  auto: <Monitor size={14} />
}

const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto'
}

export const ThemeToggle: React.FC = () => {
  const theme = useConfigStore((s) => s.config.theme)
  const cycleTheme = useConfigStore((s) => s.cycleTheme)

  return (
    <Tooltip content={`Theme: ${THEME_LABELS[theme]} (Ctrl+T)`}>
      <Button variant="icon" size="sm" onClick={cycleTheme}>
        {THEME_ICONS[theme]}
      </Button>
    </Tooltip>
  )
}
