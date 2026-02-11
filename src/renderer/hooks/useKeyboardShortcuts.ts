import { useEffect } from 'react'
import { usePaneStore } from '../stores/pane-store'
import { useLogStore } from '../stores/log-store'
import { useSearchStore } from '../stores/search-store'
import { useConfigStore } from '../stores/config-store'

export function useKeyboardShortcuts(onOpenFile: () => void): void {
  const activePaneId = usePaneStore((s) => s.activePaneId)

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+O: Open file
      if (ctrl && e.key === 'o') {
        e.preventDefault()
        onOpenFile()
        return
      }

      // Ctrl+F: Find
      if (ctrl && e.key === 'f') {
        e.preventDefault()
        useSearchStore.getState().setSearchOpen(activePaneId, true)
        return
      }

      // Escape: Close search
      if (e.key === 'Escape') {
        useSearchStore.getState().setSearchOpen(activePaneId, false)
        return
      }

      // F3 / Shift+F3: Next/prev match
      if (e.key === 'F3') {
        e.preventDefault()
        if (e.shiftKey) {
          useSearchStore.getState().prevMatch(activePaneId)
        } else {
          useSearchStore.getState().nextMatch(activePaneId)
        }
        return
      }

      // Alt+F: Toggle follow
      if (e.altKey && e.key === 'f') {
        e.preventDefault()
        useLogStore.getState().toggleFollowMode(activePaneId)
        return
      }

      // Ctrl+\: Split horizontal
      if (ctrl && e.key === '\\') {
        e.preventDefault()
        usePaneStore.getState().splitPane(activePaneId, 'horizontal')
        return
      }

      // Ctrl+-: Split vertical
      if (ctrl && e.key === '-') {
        e.preventDefault()
        usePaneStore.getState().splitPane(activePaneId, 'vertical')
        return
      }

      // Ctrl+W: Close pane
      if (ctrl && e.key === 'w') {
        e.preventDefault()
        usePaneStore.getState().closePane(activePaneId)
        return
      }

      // Ctrl+Tab: Cycle pane
      if (ctrl && e.key === 'Tab') {
        e.preventDefault()
        usePaneStore.getState().cycleActivePane()
        return
      }

      // Ctrl+T: Toggle theme
      if (ctrl && e.key === 't') {
        e.preventDefault()
        useConfigStore.getState().cycleTheme()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activePaneId, onOpenFile])
}
