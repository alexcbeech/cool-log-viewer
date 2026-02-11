import { describe, it, expect, beforeEach } from 'vitest'
import { usePaneStore } from '@renderer/stores/pane-store'
import { isLeaf, isSplit } from '@renderer/types/pane'
import type { PaneSplit } from '@renderer/types/pane'

/**
 * Reset store to a fresh single-leaf state before each test.
 * Zustand stores are singletons, so we use setState + getState to reset.
 */
function resetStore(): void {
  const { setRoot } = usePaneStore.getState()
  // Build a fresh leaf via splitPane/closePane is complex;
  // instead, directly set a known root.
  const freshLeaf = { type: 'leaf' as const, id: 'test-leaf-1', filePath: null }
  setRoot(freshLeaf)
}

describe('usePaneStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('has one leaf as root', () => {
      const { root } = usePaneStore.getState()
      expect(isLeaf(root)).toBe(true)
      expect(root.type).toBe('leaf')
    })

    it('activePaneId matches the root leaf id', () => {
      const { root, activePaneId } = usePaneStore.getState()
      expect(activePaneId).toBe(root.id)
    })
  })

  describe('splitPane', () => {
    it('creates a split with two children', () => {
      const { root } = usePaneStore.getState()
      const originalId = root.id

      usePaneStore.getState().splitPane(originalId, 'horizontal')

      const { root: newRoot } = usePaneStore.getState()
      expect(isSplit(newRoot)).toBe(true)

      const split = newRoot as PaneSplit
      expect(split.direction).toBe('horizontal')
      expect(split.children).toHaveLength(2)
      expect(isLeaf(split.children[0])).toBe(true)
      expect(isLeaf(split.children[1])).toBe(true)
    })

    it('sets the new leaf as the active pane', () => {
      const { root } = usePaneStore.getState()
      const originalId = root.id

      usePaneStore.getState().splitPane(originalId, 'vertical')

      const { root: newRoot, activePaneId } = usePaneStore.getState()
      const split = newRoot as PaneSplit

      // The original leaf is the first child, new leaf is the second
      expect(split.children[0].id).toBe(originalId)
      expect(activePaneId).toBe(split.children[1].id)
    })

    it('preserves the original leaf in the first child position', () => {
      const { root } = usePaneStore.getState()
      const originalId = root.id

      usePaneStore.getState().splitPane(originalId, 'horizontal')

      const { root: newRoot } = usePaneStore.getState()
      const split = newRoot as PaneSplit
      expect(split.children[0].id).toBe(originalId)
    })
  })

  describe('closePane', () => {
    it('does not close the last remaining leaf', () => {
      const { root } = usePaneStore.getState()
      const originalId = root.id

      usePaneStore.getState().closePane(originalId)

      const { root: afterRoot } = usePaneStore.getState()
      expect(afterRoot.id).toBe(originalId)
      expect(isLeaf(afterRoot)).toBe(true)
    })

    it('removes a leaf and simplifies the tree', () => {
      const { root } = usePaneStore.getState()
      const originalId = root.id

      // Split to create two leaves
      usePaneStore.getState().splitPane(originalId, 'horizontal')
      const { root: splitRoot } = usePaneStore.getState()
      const split = splitRoot as PaneSplit
      const secondLeafId = split.children[1].id

      // Close the second leaf; tree should simplify back to a single leaf
      usePaneStore.getState().closePane(secondLeafId)

      const { root: afterClose } = usePaneStore.getState()
      expect(isLeaf(afterClose)).toBe(true)
      expect(afterClose.id).toBe(originalId)
    })

    it('updates activePaneId when the active pane is closed', () => {
      const { root } = usePaneStore.getState()
      const originalId = root.id

      usePaneStore.getState().splitPane(originalId, 'horizontal')
      const { activePaneId: newActiveId } = usePaneStore.getState()

      // The new leaf is active; close it
      usePaneStore.getState().closePane(newActiveId)

      const { activePaneId: afterCloseActiveId } = usePaneStore.getState()
      expect(afterCloseActiveId).toBe(originalId)
    })
  })

  describe('setFilePath', () => {
    it('updates the correct leaf file path', () => {
      const { root } = usePaneStore.getState()

      usePaneStore.getState().setFilePath(root.id, '/var/log/app.log')

      const { root: updatedRoot } = usePaneStore.getState()
      expect(isLeaf(updatedRoot)).toBe(true)
      if (isLeaf(updatedRoot)) {
        expect(updatedRoot.filePath).toBe('/var/log/app.log')
      }
    })

    it('updates the correct leaf when multiple leaves exist', () => {
      const { root } = usePaneStore.getState()
      const firstId = root.id

      usePaneStore.getState().splitPane(firstId, 'horizontal')
      const { root: splitRoot } = usePaneStore.getState()
      const split = splitRoot as PaneSplit
      const secondId = split.children[1].id

      usePaneStore.getState().setFilePath(secondId, '/tmp/test.log')

      const { root: updatedRoot } = usePaneStore.getState()
      const updatedSplit = updatedRoot as PaneSplit

      // First leaf should still have null filePath
      if (isLeaf(updatedSplit.children[0])) {
        expect(updatedSplit.children[0].filePath).toBeNull()
      }
      // Second leaf should have the updated path
      if (isLeaf(updatedSplit.children[1])) {
        expect(updatedSplit.children[1].filePath).toBe('/tmp/test.log')
      }
    })
  })

  describe('cycleActivePane', () => {
    it('cycles to the next leaf', () => {
      const { root } = usePaneStore.getState()
      const firstId = root.id

      usePaneStore.getState().splitPane(firstId, 'horizontal')
      const { root: splitRoot } = usePaneStore.getState()
      const split = splitRoot as PaneSplit
      const secondId = split.children[1].id

      // Active pane is currently the second leaf (set by splitPane)
      expect(usePaneStore.getState().activePaneId).toBe(secondId)

      // Cycle should go back to the first leaf
      usePaneStore.getState().cycleActivePane()
      expect(usePaneStore.getState().activePaneId).toBe(firstId)
    })

    it('wraps around to the first leaf after the last', () => {
      const { root } = usePaneStore.getState()
      const firstId = root.id

      usePaneStore.getState().splitPane(firstId, 'horizontal')
      const { root: splitRoot } = usePaneStore.getState()
      const split = splitRoot as PaneSplit
      const secondId = split.children[1].id

      // Set active to first leaf manually
      usePaneStore.getState().setActivePane(firstId)
      expect(usePaneStore.getState().activePaneId).toBe(firstId)

      // Cycle: first -> second
      usePaneStore.getState().cycleActivePane()
      expect(usePaneStore.getState().activePaneId).toBe(secondId)

      // Cycle: second -> first (wrap around)
      usePaneStore.getState().cycleActivePane()
      expect(usePaneStore.getState().activePaneId).toBe(firstId)
    })

    it('stays on the same pane when there is only one leaf', () => {
      const { root, activePaneId } = usePaneStore.getState()

      usePaneStore.getState().cycleActivePane()

      expect(usePaneStore.getState().activePaneId).toBe(activePaneId)
    })
  })
})
