import React, { useCallback } from 'react'
import { AlertTriangle, FolderOpen, X } from 'lucide-react'
import { PaneHeader } from './PaneHeader'
import { LogView } from '../log-view/LogView'
import { SearchBar } from '../search/SearchBar'
import { usePaneStore } from '../../stores/pane-store'
import { useSearchStore } from '../../stores/search-store'
import { useLogStore } from '../../stores/log-store'
import { useDragDrop } from '../../hooks/useDragDrop'

interface PaneProps {
  paneId: string
  filePath: string | null
  onOpenFile: () => void
  onClosePane: () => void
}

export const Pane: React.FC<PaneProps> = ({ paneId, filePath, onOpenFile, onClosePane }) => {
  const activePaneId = usePaneStore((s) => s.activePaneId)
  const setActivePane = usePaneStore((s) => s.setActivePane)
  const isActive = paneId === activePaneId
  const searchState = useSearchStore((s) => s.getSearchState(paneId))
  const error = useLogStore((s) => s.panes.get(paneId)?.error)
  const setError = useLogStore((s) => s.setError)

  const handleFileDrop = useCallback(
    (droppedPath: string) => {
      // This will be handled by App.tsx via event
      window.dispatchEvent(
        new CustomEvent('pane-file-drop', { detail: { paneId, filePath: droppedPath } })
      )
    },
    [paneId]
  )

  const { isDragOver, onDragOver, onDragLeave, onDrop } = useDragDrop(handleFileDrop)

  return (
    <div
      className={`flex h-full flex-col overflow-hidden border ${
        isActive ? 'border-[var(--accent)]' : 'border-[var(--border-primary)]'
      }`}
      onClick={() => setActivePane(paneId)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <PaneHeader paneId={paneId} filePath={filePath} onClosePane={onClosePane} />
      <div className="relative flex-1 overflow-hidden">
        {filePath ? (
          <div className="flex h-full min-h-0 flex-col">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 border-b border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
              >
                <AlertTriangle size={14} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate" title={error}>
                  {error}
                </span>
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-amber-500/20"
                  aria-label="Dismiss file error"
                  onClick={() => setError(paneId, null)}
                >
                  <X size={13} />
                </button>
              </div>
            )}
            <div className="relative min-h-0 flex-1">
              <LogView paneId={paneId} />
              {searchState.isSearchOpen && <SearchBar paneId={paneId} />}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
            <FolderOpen size={48} strokeWidth={1} />
            <p className="text-sm">Open a file or drag one here</p>
            <button
              onClick={onOpenFile}
              className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              Open File
            </button>
          </div>
        )}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-drop-zone)] border-2 border-dashed border-[var(--accent)] z-10">
            <p className="text-sm font-medium text-[var(--accent)]">Drop file here</p>
          </div>
        )}
      </div>
    </div>
  )
}
