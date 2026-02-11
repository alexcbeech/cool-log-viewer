import { create } from 'zustand'
import type { LogLine } from '../types/log'
import { MAX_LINES } from '@shared/constants'

interface PaneLogState {
  lines: LogLine[]
  followMode: boolean
  lineCount: number
}

interface LogStore {
  panes: Map<string, PaneLogState>

  initPane: (paneId: string) => void
  removePane: (paneId: string) => void
  appendLines: (paneId: string, newLines: string[], isInitial: boolean) => void
  clearLines: (paneId: string) => void
  setFollowMode: (paneId: string, follow: boolean) => void
  toggleFollowMode: (paneId: string) => void
  getPaneState: (paneId: string) => PaneLogState | undefined
}

function createPaneState(): PaneLogState {
  return { lines: [], followMode: true, lineCount: 0 }
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

  appendLines: (paneId, newLines, isInitial) =>
    set((state) => {
      const panes = new Map(state.panes)
      const paneState = panes.get(paneId)
      if (!paneState) return state

      const logLines: LogLine[] = newLines.map((text, i) => ({
        lineNumber: isInitial ? i + 1 : paneState.lineCount + i + 1,
        text
      }))

      let combined: LogLine[]
      if (isInitial) {
        combined = logLines
      } else {
        combined = [...paneState.lines, ...logLines]
      }

      // Trim front if exceeding max
      if (combined.length > MAX_LINES) {
        combined = combined.slice(combined.length - MAX_LINES)
      }

      panes.set(paneId, {
        ...paneState,
        lines: combined,
        lineCount: isInitial ? logLines.length : paneState.lineCount + newLines.length
      })
      return { panes }
    }),

  clearLines: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      const paneState = panes.get(paneId)
      if (!paneState) return state
      panes.set(paneId, { ...paneState, lines: [], lineCount: 0 })
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
