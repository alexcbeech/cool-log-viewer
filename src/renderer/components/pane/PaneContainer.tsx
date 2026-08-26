import React from 'react'
import { Allotment } from 'allotment'
import 'allotment/dist/style.css'
import type { PaneNode } from '../../types/pane'
import { isLeaf } from '../../types/pane'
import { Pane } from './Pane'
import { usePaneStore } from '../../stores/pane-store'

interface PaneContainerProps {
  node: PaneNode
  onOpenFileForPane: (paneId: string) => void
  onClosePane: (paneId: string) => void
}

export const PaneContainer: React.FC<PaneContainerProps> = ({
  node,
  onOpenFileForPane,
  onClosePane
}) => {
  const setSizes = usePaneStore((s) => s.setSizes)

  if (isLeaf(node)) {
    return (
      <Pane
        paneId={node.id}
        filePath={node.filePath}
        onOpenFile={() => onOpenFileForPane(node.id)}
        onClosePane={() => onClosePane(node.id)}
      />
    )
  }

  const isVertical = node.direction === 'vertical'

  return (
    <Allotment
      vertical={isVertical}
      defaultSizes={node.sizes}
      onChange={(sizes) => setSizes(node.id, sizes)}
    >
      {node.children.map((child) => (
        <Allotment.Pane key={child.id}>
          <PaneContainer
            node={child}
            onOpenFileForPane={onOpenFileForPane}
            onClosePane={onClosePane}
          />
        </Allotment.Pane>
      ))}
    </Allotment>
  )
}
