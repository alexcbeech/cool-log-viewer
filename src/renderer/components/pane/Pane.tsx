import React, { useCallback } from 'react'
import { FolderOpen } from 'lucide-react'
import { PaneHeader } from './PaneHeader'
import { LogView } from '../log-view/LogView'
import { SearchBar } from '../search/SearchBar'
import { usePaneStore } from '../../stores/pane-store'
import { useSearchStore } from '../../stores/search-store'
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
          <>
            <LogView paneId={paneId} />
            {searchState.isSearchOpen && <SearchBar paneId={paneId} />}
          </>
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
