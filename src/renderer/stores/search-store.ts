import { create } from 'zustand'

export interface SearchMatch {
  lineIndex: number
  start: number
  end: number
}

interface PaneSearchState {
  query: string
  isRegex: boolean
  caseSensitive: boolean
  matches: SearchMatch[]
  currentMatchIndex: number
  isSearchOpen: boolean
  isSearching: boolean
}

interface SearchStore {
  panes: Map<string, PaneSearchState>

  getSearchState: (paneId: string) => PaneSearchState
  setSearchOpen: (paneId: string, open: boolean) => void
  setQuery: (paneId: string, query: string) => void
  setIsRegex: (paneId: string, isRegex: boolean) => void
  setCaseSensitive: (paneId: string, caseSensitive: boolean) => void
  setMatches: (paneId: string, matches: SearchMatch[]) => void
  setIsSearching: (paneId: string, isSearching: boolean) => void
  nextMatch: (paneId: string) => void
  prevMatch: (paneId: string) => void
  clearSearch: (paneId: string) => void
  removePane: (paneId: string) => void
}

const DEFAULT_SEARCH_STATE: PaneSearchState = Object.freeze({
  query: '',
  isRegex: false,
  caseSensitive: false,
  matches: [],
  currentMatchIndex: -1,
  isSearchOpen: false,
  isSearching: false
})

function createSearchState(): PaneSearchState {
  return { ...DEFAULT_SEARCH_STATE, matches: [] }
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  panes: new Map(),

  getSearchState: (paneId) => {
    return get().panes.get(paneId) ?? DEFAULT_SEARCH_STATE
  },

  setSearchOpen: (paneId, open) =>
    set((state) => {
      const panes = new Map(state.panes)
      const s = panes.get(paneId) ?? createSearchState()
      panes.set(paneId, { ...s, isSearchOpen: open })
      return { panes }
    }),

  setQuery: (paneId, query) =>
    set((state) => {
      const panes = new Map(state.panes)
      const s = panes.get(paneId) ?? createSearchState()
      panes.set(paneId, { ...s, query, currentMatchIndex: -1, matches: [] })
      return { panes }
    }),

  setIsRegex: (paneId, isRegex) =>
    set((state) => {
      const panes = new Map(state.panes)
      const s = panes.get(paneId) ?? createSearchState()
      panes.set(paneId, { ...s, isRegex })
      return { panes }
    }),

  setCaseSensitive: (paneId, caseSensitive) =>
    set((state) => {
      const panes = new Map(state.panes)
      const s = panes.get(paneId) ?? createSearchState()
      panes.set(paneId, { ...s, caseSensitive })
      return { panes }
    }),

  setMatches: (paneId, matches) =>
    set((state) => {
      const panes = new Map(state.panes)
      const s = panes.get(paneId) ?? createSearchState()
      panes.set(paneId, {
        ...s,
        matches,
        currentMatchIndex: matches.length > 0 ? 0 : -1,
        isSearching: false
      })
      return { panes }
    }),

  setIsSearching: (paneId, isSearching) =>
    set((state) => {
      const panes = new Map(state.panes)
      const s = panes.get(paneId) ?? createSearchState()
      panes.set(paneId, { ...s, isSearching })
      return { panes }
    }),

  nextMatch: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      const s = panes.get(paneId) ?? createSearchState()
      if (s.matches.length === 0) return state
      const nextIndex = (s.currentMatchIndex + 1) % s.matches.length
      panes.set(paneId, { ...s, currentMatchIndex: nextIndex })
      return { panes }
    }),

  prevMatch: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      const s = panes.get(paneId) ?? createSearchState()
      if (s.matches.length === 0) return state
      const prevIndex = s.currentMatchIndex <= 0 ? s.matches.length - 1 : s.currentMatchIndex - 1
      panes.set(paneId, { ...s, currentMatchIndex: prevIndex })
      return { panes }
    }),

  clearSearch: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      panes.set(paneId, createSearchState())
      return { panes }
    }),

  removePane: (paneId) =>
    set((state) => {
      const panes = new Map(state.panes)
      panes.delete(paneId)
      return { panes }
    })
}))
