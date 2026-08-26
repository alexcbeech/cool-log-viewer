import { beforeEach, describe, expect, it } from 'vitest'
import { useLogStore } from '@renderer/stores/log-store'

describe('log store line replacement', () => {
  beforeEach(() => {
    useLogStore.setState({ panes: new Map() })
    useLogStore.getState().initPane('pane-1')
  })

  it('replaces a displayed partial line without incrementing its line number', () => {
    const store = useLogStore.getState()
    store.appendLines('pane-1', ['first', 'par'], true)
    store.appendLines('pane-1', ['partial'], false, true)

    const pane = useLogStore.getState().getPaneState('pane-1')
    expect(pane?.lines).toEqual([
      { lineNumber: 1, text: 'first' },
      { lineNumber: 2, text: 'partial' }
    ])
    expect(pane?.lineCount).toBe(2)
  })

  it('replaces the partial line and appends following lines atomically', () => {
    const store = useLogStore.getState()
    store.appendLines('pane-1', ['partial'], true)
    store.appendLines('pane-1', ['completed', 'next'], false, true)

    const pane = useLogStore.getState().getPaneState('pane-1')
    expect(pane?.lines).toEqual([
      { lineNumber: 1, text: 'completed' },
      { lineNumber: 2, text: 'next' }
    ])
    expect(pane?.lineCount).toBe(2)
  })
})
