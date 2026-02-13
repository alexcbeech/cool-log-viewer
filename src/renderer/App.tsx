import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Highlighter } from 'lucide-react'
import { WorkspaceBar } from './components/workspace/WorkspaceBar'
import { PaneContainer } from './components/pane/PaneContainer'
import { HighlightsManager } from './components/highlights/HighlightsManager'
import { ThemeToggle } from './components/settings/ThemeToggle'
import { Button } from './components/common/Button'
import { Tooltip } from './components/common/Tooltip'
import { usePaneStore } from './stores/pane-store'
import { useLogStore } from './stores/log-store'
import { useSearchStore } from './stores/search-store'
import { useConfigStore } from './stores/config-store'
import { useHighlightStore } from './stores/highlight-store'
import { useTheme } from './hooks/useTheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { ipcClient } from './lib/ipc-client'
import { isLeaf } from './types/pane'
import type { PaneNode } from './types/pane'
import type { AppConfig } from './types/config'
import type { FileLinesPayload, FileErrorPayload, FileTruncatedPayload } from '../shared/ipc-types'

function collectLeafPanes(node: PaneNode): Array<{ id: string; filePath: string | null }> {
  if (isLeaf(node)) return [{ id: node.id, filePath: node.filePath }]
  return node.children.flatMap(collectLeafPanes)
}

export const App: React.FC = () => {
  const root = usePaneStore((s) => s.root)
  const activePaneId = usePaneStore((s) => s.activePaneId)
  const setFilePath = usePaneStore((s) => s.setFilePath)
  const splitPane = usePaneStore((s) => s.splitPane)
  const closePaneStore = usePaneStore((s) => s.closePane)
  const setRoot = usePaneStore((s) => s.setRoot)
  const initPane = useLogStore((s) => s.initPane)
  const removePane = useLogStore((s) => s.removePane)
  const appendLines = useLogStore((s) => s.appendLines)
  const clearLines = useLogStore((s) => s.clearLines)
  const cycleTheme = useConfigStore((s) => s.cycleTheme)
  const [highlightsOpen, setHighlightsOpen] = useState(false)

  useTheme()

  // Close pane: stop tail, clean up log state, then remove from tree
  const closePane = useCallback(
    async (paneId: string) => {
      try {
        await ipcClient.stopTail(paneId)
      } catch {
        // Ignore errors — tail may already be stopped
      }
      removePane(paneId)
      closePaneStore(paneId)
    },
    [closePaneStore, removePane]
  )

  // Open file for a specific pane
  const openFileForPane = useCallback(
    async (paneId: string) => {
      const result = await ipcClient.openFileDialog()
      if (result.canceled || result.filePaths.length === 0) return

      for (let i = 0; i < result.filePaths.length; i++) {
        const filePath = result.filePaths[i]
        let targetPaneId = paneId

        // For additional files, split the pane
        if (i > 0) {
          splitPane(targetPaneId, 'horizontal')
          // Get the newly created pane id
          const newState = usePaneStore.getState()
          targetPaneId = newState.activePaneId
        }

        // Stop any existing tail
        await ipcClient.stopTail(targetPaneId)
        clearLines(targetPaneId)

        // Start new tail
        setFilePath(targetPaneId, filePath)
        initPane(targetPaneId)
        await ipcClient.startTail(targetPaneId, filePath)
      }
    },
    [splitPane, setFilePath, initPane, clearLines]
  )

  // Open file triggered by menu/keyboard
  const openFile = useCallback(() => {
    openFileForPane(activePaneId)
  }, [activePaneId, openFileForPane])

  useKeyboardShortcuts(openFile)

  // Handle file drop on pane
  useEffect(() => {
    const handler = async (e: Event): Promise<void> => {
      const { paneId, filePath } = (e as CustomEvent).detail
      await ipcClient.stopTail(paneId)
      clearLines(paneId)
      setFilePath(paneId, filePath)
      initPane(paneId)
      await ipcClient.startTail(paneId, filePath)
    }
    window.addEventListener('pane-file-drop', handler)
    return () => window.removeEventListener('pane-file-drop', handler)
  }, [setFilePath, initPane, clearLines])

  // IPC event listeners
  useEffect(() => {
    const unsubs = [
      ipcClient.onFileLines((payload: FileLinesPayload) => {
        appendLines(payload.paneId, payload.lines, payload.isInitial)
      }),
      ipcClient.onFileError((payload: FileErrorPayload) => {
        console.error(`File error for pane ${payload.paneId}:`, payload.error)
      }),
      ipcClient.onFileTruncated((payload: FileTruncatedPayload) => {
        clearLines(payload.paneId)
      }),
      ipcClient.onMenuOpenFile(() => openFile()),
      ipcClient.onMenuClosePane(() => closePane(activePaneId)),
      ipcClient.onMenuFind(() => {
        useSearchStore.getState().setSearchOpen(activePaneId, true)
      }),
      ipcClient.onMenuSplitHorizontal(() => splitPane(activePaneId, 'horizontal')),
      ipcClient.onMenuSplitVertical(() => splitPane(activePaneId, 'vertical')),
      ipcClient.onMenuToggleFollow(() => {
        useLogStore.getState().toggleFollowMode(activePaneId)
      }),
      ipcClient.onMenuToggleTheme(() => cycleTheme()),
      ipcClient.onMenuNextPane(() => {
        usePaneStore.getState().cycleActivePane()
      }),
      ipcClient.onMenuIncreaseFontSize(() => {
        useConfigStore.getState().increaseFontSize()
      }),
      ipcClient.onMenuDecreaseFontSize(() => {
        useConfigStore.getState().decreaseFontSize()
      })
    ]

    return () => unsubs.forEach((unsub) => unsub())
  }, [activePaneId, openFile, appendLines, clearLines, splitPane, closePane, cycleTheme])

  // Load config on mount
  useEffect(() => {
    ipcClient.loadConfig().then((config) => {
      if (config) {
        const appConfig = config as AppConfig
        useConfigStore.getState().setConfig(appConfig)
        if (appConfig.highlightRules?.length) {
          useHighlightStore.getState().setRules(appConfig.highlightRules)
        }
      }
    })
  }, [])

  // Sync highlight rules into config store when they change
  useEffect(() => {
    return useHighlightStore.subscribe((state) => {
      const configStore = useConfigStore.getState()
      if (configStore.isLoaded) {
        useConfigStore.setState({
          config: { ...configStore.config, highlightRules: state.rules }
        })
      }
    })
  }, [])

  // Save config on change (debounced)
  const configSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const unsub = useConfigStore.subscribe((state) => {
      if (state.isLoaded) {
        if (configSaveTimerRef.current) clearTimeout(configSaveTimerRef.current)
        configSaveTimerRef.current = setTimeout(() => {
          ipcClient.saveConfig(state.config)
          configSaveTimerRef.current = null
        }, 1000)
      }
    })
    return () => {
      unsub()
      if (configSaveTimerRef.current) clearTimeout(configSaveTimerRef.current)
    }
  }, [])

  // Load session on mount and restore pane layout
  useEffect(() => {
    ipcClient.loadSession().then(async (session: unknown) => {
      if (!session || typeof session !== 'object') return
      const s = session as { paneLayout?: PaneNode; activePaneId?: string }
      if (s.paneLayout) {
        setRoot(s.paneLayout)
        // Re-start tails for panes that had files open
        const leaves = collectLeafPanes(s.paneLayout)
        for (const leaf of leaves) {
          initPane(leaf.id)
          if (leaf.filePath) {
            await ipcClient.startTail(leaf.id, leaf.filePath)
          }
        }
        if (s.activePaneId) {
          usePaneStore.getState().setActivePane(s.activePaneId)
        }
      }
    })
  }, [setRoot, initPane])

  // Save session before unload
  useEffect(() => {
    const saveSession = (): void => {
      const { root, activePaneId } = usePaneStore.getState()
      ipcClient.saveSession({
        version: 1,
        paneLayout: root,
        activePaneId
      })
    }
    window.addEventListener('beforeunload', saveSession)
    return () => window.removeEventListener('beforeunload', saveSession)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <WorkspaceBar onOpenFile={openFile} />
      <div className="relative flex-1 overflow-hidden">
        <PaneContainer node={root} onOpenFileForPane={openFileForPane} onClosePane={closePane} />
        <HighlightsManager isOpen={highlightsOpen} onClose={() => setHighlightsOpen(false)} />
      </div>
      <div className="flex h-6 items-center justify-between border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2">
        <div className="flex items-center gap-2">
          <Tooltip content="Highlight Rules">
            <Button variant="icon" size="sm" onClick={() => setHighlightsOpen(!highlightsOpen)}>
              <Highlighter size={12} />
            </Button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
