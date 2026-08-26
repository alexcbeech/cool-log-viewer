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

  it('stores and clears a visible file error', () => {
    const store = useLogStore.getState()
    store.setError('pane-1', 'File was deleted')
    expect(useLogStore.getState().getPaneState('pane-1')?.error).toBe('File was deleted')

    store.setError('pane-1', null)
    expect(useLogStore.getState().getPaneState('pane-1')?.error).toBeNull()
  })

  it('clears a stale file error when reading resumes', () => {
    const store = useLogStore.getState()
    store.setError('pane-1', 'Temporarily unavailable')
    store.appendLines('pane-1', ['reconnected'], true)

    expect(useLogStore.getState().getPaneState('pane-1')?.error).toBeNull()
  })
})
