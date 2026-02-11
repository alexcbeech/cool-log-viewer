export interface PaneLeaf {
  type: 'leaf'
  id: string
  filePath: string | null
}

export interface PaneSplit {
  type: 'split'
  id: string
  direction: 'horizontal' | 'vertical'
  children: PaneNode[]
  sizes?: number[]
}

export type PaneNode = PaneLeaf | PaneSplit

export function isLeaf(node: PaneNode): node is PaneLeaf {
  return node.type === 'leaf'
}

export function isSplit(node: PaneNode): node is PaneSplit {
  return node.type === 'split'
}
