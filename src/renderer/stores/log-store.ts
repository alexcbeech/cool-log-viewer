import { create } from 'zustand'
import type { LogLine } from '../types/log'
import { useConfigStore } from './config-store'

interface PaneLogState {
  lines: LogLine[]
  followMode: boolean
  lineCount: number
  error: string | null
}

interface LogStore {
  panes: Map<string, PaneLogState>

  initPane: (paneId: string) => void
  removePane: (paneId: string) => void
  appendLines: (
    paneId: string,
    newLines: string[],
    isInitial: boolean,
    replaceLast?: boolean
  ) => void
  clearLines: (paneId: string) => void
  setError: (paneId: string, error: string | null) => void
  setFollowMode: (paneId: string, follow: boolean) => void
  toggleFollowMode: (paneId: string) => void
  getPaneState: (paneId: string) => PaneLogState | undefined
}

function createPaneState(): PaneLogState {
  return { lines: [], followMode: true, lineCount: 0, error: null }
}

export const useLogStore = create<LogStore>((set, get) => ({
  panes: new Map(),

  initPane: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      if (!panes.has(paneId)) {
        panes.set(paneId, createPaneState())
      }
      return { panes }
    }),

  removePane: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      panes.delete(paneId)
      return { panes }
    }),

  appendLines: (paneId, newLines, isInitial, replaceLast = false) =>
    set((state) => {
      const panes = new Map(state.panes)
      const paneState = panes.get(paneId)
      if (!paneState) return state

      const canReplaceLast = replaceLast && !isInitial && paneState.lines.length > 0
      const firstLineNumber = isInitial
        ? 1
        : canReplaceLast
          ? paneState.lineCount
          : paneState.lineCount + 1
      const logLines: LogLine[] = newLines.map((text, i) => ({
        lineNumber: firstLineNumber + i,
        text
      }))

      let combined: LogLine[]
      if (isInitial) {
        combined = logLines
      } else {
        const existingLines = canReplaceLast ? paneState.lines.slice(0, -1) : paneState.lines
        combined = [...existingLines, ...logLines]
      }

      // Trim front if exceeding max
      const maxLines = useConfigStore.getState().config.maxLines
      if (combined.length > maxLines) {
        combined = combined.slice(combined.length - maxLines)
      }

      panes.set(paneId, {
        ...paneState,
        lines: combined,
        error: null,
        lineCount: isInitial
          ? logLines.length
          : paneState.lineCount + newLines.length - (canReplaceLast ? 1 : 0)
      })
      return { panes }
    }),

  clearLines: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      const paneState = panes.get(paneId)
      if (!paneState) return state
      panes.set(paneId, { ...paneState, lines: [], lineCount: 0, error: null })
      return { panes }
    }),

  setError: (paneId, error) =>
    set((state) => {
      const panes = new Map(state.panes)
      const paneState = panes.get(paneId)
      if (!paneState) return state
      panes.set(paneId, { ...paneState, error })
      return { panes }
    }),

  setFollowMode: (paneId, follow) =>
    set((state) => {
      const panes = new Map(state.panes)
      const paneState = panes.get(paneId)
      if (!paneState) return state
      panes.set(paneId, { ...paneState, followMode: follow })
      return { panes }
    }),

  toggleFollowMode: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      const paneState = panes.get(paneId)
      if (!paneState) return state
      panes.set(paneId, { ...paneState, followMode: !paneState.followMode })
      return { panes }
    }),

  getPaneState: (paneId) => get().panes.get(paneId)
}))
