import React from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '../common/Button'
import { FileChip } from './FileChip'
import { usePaneStore } from '../../stores/pane-store'
import { isLeaf } from '../../types/pane'
import type { PaneNode } from '../../types/pane'

interface WorkspaceBarProps {
  onOpenFile: () => void
}

function collectFiles(node: PaneNode): { paneId: string; filePath: string }[] {
  if (isLeaf(node)) {
    return node.filePath ? [{ paneId: node.id, filePath: node.filePath }] : []
  }
  return node.children.flatMap(collectFiles)
}

export const WorkspaceBar: React.FC<WorkspaceBarProps> = ({ onOpenFile }) => {
  const root = usePaneStore((s) => s.root)
  const activePaneId = usePaneStore((s) => s.activePaneId)
  const setActivePane = usePaneStore((s) => s.setActivePane)
  const files = collectFiles(root)

  return (
    <div
      style={{ display: 'flex', height: 36, alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', paddingLeft: 12, paddingRight: 12 }}
    >
      <Button variant="ghost" size="sm" onClick={onOpenFile} title="Open File (Ctrl+O)">
        <FolderOpen size={14} className="mr-1" />
        <span>Open</span>
      </Button>
      <div className="mx-1 h-4 w-px bg-[var(--border-primary)]" />
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {files.map(({ paneId, filePath }) => (
          <FileChip
            key={paneId}
            filePath={filePath}
            isActive={paneId === activePaneId}
            onClick={() => setActivePane(paneId)}
          />
        ))}
        {files.length === 0 && (
          <span className="text-xs text-[var(--text-muted)]">No files open</span>
        )}
      </div>
    </div>
  )
}
