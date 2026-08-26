import React from 'react'
import {
  SplitSquareHorizontal,
  SplitSquareVertical,
  X,
  ArrowDownToLine,
  FileText
} from 'lucide-react'
import { Button } from '../common/Button'
import { Tooltip } from '../common/Tooltip'
import { usePaneStore } from '../../stores/pane-store'
import { useLogStore } from '../../stores/log-store'

interface PaneHeaderProps {
  paneId: string
  filePath: string | null
  onClosePane: () => void
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath
}

export const PaneHeader: React.FC<PaneHeaderProps> = ({ paneId, filePath, onClosePane }) => {
  const splitPane = usePaneStore((s) => s.splitPane)
  const paneState = useLogStore((s) => s.panes.get(paneId))
  const toggleFollowMode = useLogStore((s) => s.toggleFollowMode)
  const followMode = paneState?.followMode ?? true

  return (
    <div
      style={{
        display: 'flex',
        height: 32,
        alignItems: 'center',
        borderBottom: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-secondary)',
        paddingLeft: 12,
        paddingRight: 8
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          gap: 8,
          overflow: 'hidden',
          minWidth: 0
        }}
      >
        {filePath ? (
          <>
            <FileText size={13} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={filePath}
            >
              {getFileName(filePath)}
            </span>
            {paneState && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                {paneState.lines.length.toLocaleString()} lines
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Empty</span>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          marginLeft: 12
        }}
      >
        {filePath && (
          <Tooltip content={`Follow mode (Alt+F): ${followMode ? 'On' : 'Off'}`}>
            <Button
              variant="icon"
              size="sm"
              active={followMode}
              onClick={() => toggleFollowMode(paneId)}
            >
              <ArrowDownToLine size={14} />
            </Button>
          </Tooltip>
        )}
        <Tooltip content="Split horizontal (Ctrl+\)">
          <Button variant="icon" size="sm" onClick={() => splitPane(paneId, 'horizontal')}>
            <SplitSquareHorizontal size={14} />
          </Button>
        </Tooltip>
        <Tooltip content="Split vertical (Ctrl+-)">
          <Button variant="icon" size="sm" onClick={() => splitPane(paneId, 'vertical')}>
            <SplitSquareVertical size={14} />
          </Button>
        </Tooltip>
        <div
          style={{
            width: 1,
            height: 14,
            backgroundColor: 'var(--border-secondary)',
            marginLeft: 4,
            marginRight: 4
          }}
        />
        <Tooltip content="Close pane (Ctrl+W)">
          <Button variant="icon" size="sm" onClick={onClosePane}>
            <X size={14} />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
