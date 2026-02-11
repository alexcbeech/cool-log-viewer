import { create } from 'zustand'
import type { PaneNode, PaneLeaf, PaneSplit } from '../types/pane'
import { isLeaf } from '../types/pane'

let paneCounter = 0
export function generatePaneId(): string {
  return `pane-${++paneCounter}`
}

// After restoring pane IDs from a session, sync the counter so new IDs don't collide
function syncPaneCounter(node: PaneNode): void {
  const match = node.id.match(/^pane-(\d+)$/)
  if (match) {
    const num = parseInt(match[1], 10)
    if (num > paneCounter) paneCounter = num
  }
  if (!isLeaf(node)) {
    for (const child of (node as PaneSplit).children) {
      syncPaneCounter(child)
    }
  }
}

function createLeaf(filePath: string | null = null): PaneLeaf {
  return { type: 'leaf', id: generatePaneId(), filePath }
}

function findNode(root: PaneNode, id: string): PaneNode | null {
  if (root.id === id) return root
  if (isLeaf(root)) return null
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

function findParent(root: PaneNode, id: string): PaneSplit | null {
  if (isLeaf(root)) return null
  for (const child of root.children) {
    if (child.id === id) return root as PaneSplit
    const found = findParent(child, id)
    if (found) return found
  }
  return null
}

// Replace exactly one occurrence of the node with the given id.
// Does NOT recurse into the replacement, so the replacement can safely
// contain a child with the same id as the node being replaced.
function replaceNode(root: PaneNode, id: string, replacement: PaneNode): PaneNode {
  let replaced = false

  function replace(node: PaneNode): PaneNode {
    if (replaced) return node
    if (node.id === id) {
      replaced = true
      return replacement
    }
    if (isLeaf(node)) return node
    return {
      ...node,
      children: node.children.map((child) => replace(child))
    } as PaneSplit
  }

  return replace(root)
}

// Remove the first occurrence of a node with the given id.
function removeNode(root: PaneNode, id: string): PaneNode | null {
  let removed = false

  function remove(node: PaneNode): PaneNode | null {
    if (removed) return node
    if (node.id === id) {
      removed = true
      return null
    }
    if (isLeaf(node)) return node
    const split = node as PaneSplit
    const newChildren = split.children
      .map((child) => remove(child))
      .filter((child): child is PaneNode => child !== null)

    if (newChildren.length === 0) return null
    if (newChildren.length === 1) return newChildren[0]
    return { ...split, children: newChildren }
  }

  return remove(root)
}

function getAllLeafIds(node: PaneNode): string[] {
  if (isLeaf(node)) return [node.id]
  return (node as PaneSplit).children.flatMap(getAllLeafIds)
}

interface PaneStore {
  root: PaneNode
  activePaneId: string

  setActivePane: (id: string) => void
  splitPane: (paneId: string, direction: 'horizontal' | 'vertical') => void
  closePane: (paneId: string) => void
  setFilePath: (paneId: string, filePath: string) => void
  cycleActivePane: () => void
  setRoot: (root: PaneNode) => void
  setSizes: (splitId: string, sizes: number[]) => void
}

const initialLeaf = createLeaf()

export const usePaneStore = create<PaneStore>((set, get) => ({
  root: initialLeaf,
  activePaneId: initialLeaf.id,

  setActivePane: (id) => set({ activePaneId: id }),

  splitPane: (paneId, direction) =>
    set((state) => {
      const node = findNode(state.root, paneId)
      if (!node || !isLeaf(node)) return state

      const newLeaf = createLeaf()
      const split: PaneSplit = {
        type: 'split',
        id: generatePaneId(),
        direction,
        children: [node, newLeaf]
      }
      // replaceNode only replaces the first match and stops,
      // so the original node inside the split's children is preserved.
      const newRoot = replaceNode(state.root, paneId, split)
      return { root: newRoot, activePaneId: newLeaf.id }
    }),

  closePane: (paneId) =>
    set((state) => {
      const allLeafIds = getAllLeafIds(state.root)
      if (allLeafIds.length <= 1) return state

      const newRoot = removeNode(state.root, paneId)
      if (!newRoot) return state

      const newLeafIds = getAllLeafIds(newRoot)
      const newActiveId = newLeafIds.includes(state.activePaneId)
        ? state.activePaneId
        : newLeafIds[0]

      return { root: newRoot, activePaneId: newActiveId }
    }),

  setFilePath: (paneId, filePath) =>
    set((state) => {
      const node = findNode(state.root, paneId)
      if (!node || !isLeaf(node)) return state
      const newRoot = replaceNode(state.root, paneId, { ...node, filePath })
      return { root: newRoot }
    }),

  cycleActivePane: () =>
    set((state) => {
      const leafIds = getAllLeafIds(state.root)
      const currentIndex = leafIds.indexOf(state.activePaneId)
      const nextIndex = (currentIndex + 1) % leafIds.length
      return { activePaneId: leafIds[nextIndex] }
    }),

  setRoot: (root) =>
    set(() => {
      syncPaneCounter(root)
      const leafIds = getAllLeafIds(root)
      return { root, activePaneId: leafIds[0] }
    }),

  setSizes: (splitId, sizes) =>
    set((state) => {
      const node = findNode(state.root, splitId)
      if (!node || isLeaf(node)) return state
      const newRoot = replaceNode(state.root, splitId, { ...node, sizes })
      return { root: newRoot }
    })
}))
