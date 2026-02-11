# Cool Log Viewer — MVP Implementation Plan

## Context

Building a fast, multi-pane log viewer for developers (Electron + React). The app opens multiple log files simultaneously, supports flexible split-pane layouts, live-tail following, configurable highlighting, search, dark/light themes, and session persistence. This plan covers **Milestone 1 (MVP)**: Windows-first, one file per pane, no tabs.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Shell | **Electron 40.x** | Cross-platform, native file I/O |
| Build | **electron-vite 5.x** | Unified Vite config for main/preload/renderer, fast HMR |
| Packaging | **electron-builder** | Flexible Windows targets (NSIS, portable) |
| UI | **React 19 + TypeScript 5** | Type safety across IPC boundary |
| State | **Zustand 5.x** | Minimal boilerplate, works outside components for IPC handlers |
| Virtualization | **@tanstack/react-virtual 3.x** | Headless, low overhead, precise row control |
| Split panes | **allotment 1.x** | VS Code-grade nested splits |
| Styling | **Tailwind CSS 4.x** | Fast iteration, built-in dark mode via CSS custom properties |
| File watching | **chokidar 5.x** | Uses ReadDirectoryChangesW on Windows |
| Validation | **zod** | Config/session schema validation + migration |
| Icons | **lucide-react** | Lightweight, tree-shakable |
| Testing | **Vitest** (unit), **@testing-library/react** (component), **Playwright** (E2E) |

---

## Project Structure

```
cool-log-viewer/
├── electron.vite.config.ts         # Unified main/preload/renderer Vite config
├── electron-builder.yml            # Packaging config
├── package.json
├── tsconfig.json / .node.json / .web.json
├── tailwind.config.ts
├── src/
│   ├── main/                       # Electron main process
│   │   ├── index.ts                # App entry, window creation, IPC registration
│   │   ├── window-manager.ts       # Window geometry save/restore
│   │   ├── ipc-handlers.ts         # All ipcMain.handle registrations
│   │   ├── menu.ts                 # App menu
│   │   ├── tail-engine/
│   │   │   ├── tail-engine.ts      # Orchestrator: manages per-pane file sessions
│   │   │   ├── file-reader.ts      # Backward chunk read, forward tail read
│   │   │   ├── file-watcher.ts     # Chokidar wrapper with truncation detection
│   │   │   ├── line-buffer.ts      # Ring buffer (100k lines default)
│   │   │   └── types.ts
│   │   ├── persistence/
│   │   │   ├── config-store.ts     # Load/save config.json
│   │   │   ├── session-store.ts    # Load/save session.json
│   │   │   ├── schemas.ts          # Zod schemas with defaults
│   │   │   └── migrations.ts       # Schema version migrations
│   │   └── utils/
│   │       ├── paths.ts            # %APPDATA%/cool-log-viewer/
│   │       └── logger.ts
│   ├── preload/
│   │   ├── index.ts                # contextBridge.exposeInMainWorld
│   │   └── api.ts                  # ElectronAPI type definition
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx                # React root
│   │   ├── App.tsx                 # Top layout + IPC event wiring
│   │   ├── assets/styles/
│   │   │   ├── globals.css         # Tailwind + CSS custom props for themes
│   │   │   └── log-line.css        # Performance-critical log line styles
│   │   ├── components/
│   │   │   ├── workspace/          # WorkspaceBar, FileChip
│   │   │   ├── pane/               # PaneContainer, Pane, PaneHeader
│   │   │   ├── log-view/           # LogView, LogLine, useVirtualScroll, useFollowMode
│   │   │   ├── search/             # SearchBar, useSearch, search-worker.ts (Web Worker)
│   │   │   ├── highlights/         # HighlightsManager, HighlightRuleRow
│   │   │   ├── settings/           # ThemeToggle
│   │   │   └── common/             # Button, Input, Toggle, Tooltip
│   │   ├── stores/
│   │   │   ├── pane-store.ts       # Pane tree layout + operations
│   │   │   ├── log-store.ts        # Per-pane line buffers
│   │   │   ├── search-store.ts     # Per-pane search state
│   │   │   ├── highlight-store.ts  # Rules + compiled regexes
│   │   │   └── config-store.ts     # Theme, font, settings
│   │   ├── hooks/
│   │   │   ├── useIpc.ts           # Typed IPC invoke/event hooks
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   ├── useTheme.ts         # OS detection + toggle
│   │   │   └── useDragDrop.ts
│   │   ├── lib/
│   │   │   ├── highlight-engine.ts # Pure function: rules -> styled spans
│   │   │   ├── ipc-client.ts       # Typed window.electronAPI wrapper
│   │   │   └── constants.ts
│   │   └── types/
│   │       ├── pane.ts             # PaneNode, PaneLeaf, PaneSplit
│   │       ├── log.ts              # LogLine, LineChunk
│   │       ├── highlight.ts        # HighlightRule, HighlightSpan
│   │       └── config.ts
│   └── shared/                     # Shared between main + renderer
│       ├── ipc-channels.ts         # Channel name constants
│       ├── ipc-types.ts            # Request/response types per channel
│       └── constants.ts
├── tests/
│   ├── unit/main/                  # tail-engine, file-reader, line-buffer, persistence
│   ├── unit/renderer/              # highlight-engine, pane-store, log-store
│   ├── integration/                # IPC roundtrip
│   └── e2e/                        # Playwright: launch, open file, follow, search, persist
└── resources/test-fixtures/        # small.log, medium.log (100k lines)
```

---

## Implementation Phases

### Phase 0: Project Scaffolding
- Initialize package.json, install Electron + React + electron-vite + TypeScript
- Create `electron.vite.config.ts` with main/preload/renderer build targets
- Create tsconfig files (base, node, web)
- Minimal entry files: main creates BrowserWindow, renderer mounts `<App />`
- Set up Tailwind CSS 4.x with `@tailwindcss/vite` plugin
- Set up ESLint + Prettier
- **Verify:** `npm run dev` opens Electron window with HMR

### Phase 1: IPC Layer
- Define channel names in `src/shared/ipc-channels.ts`
- Define typed request/response payloads in `src/shared/ipc-types.ts`
- Implement preload `contextBridge` exposing typed `ElectronAPI`
- Register stub IPC handlers in main process
- Create `useIpc` hook for renderer event subscriptions
- **Security:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`

### Phase 2: Tail Engine (Main Process)
- **file-reader.ts**: Backward chunk reader (64KB chunks from EOF) for initial load — a 10GB file opens in ~1ms. Forward reader from last byte offset for ongoing tail. Truncation detection via fstat size comparison.
- **line-buffer.ts**: Ring buffer capped at configurable max (default 100k lines)
- **file-watcher.ts**: Chokidar wrapper, debounce change events (50ms), fallback to 250ms polling
- **tail-engine.ts**: Manages Map<paneId, TailSession>. Batches new lines for 50ms before IPC send. Sends initial load in 5000-line chunks for progressive rendering.
- Wire into IPC handlers: `file:start-tail`, `file:stop-tail`, push lines via `webContents.send`

### Phase 3: Pane Layout System (Renderer)
- Data model: recursive tree (`PaneNode = PaneLeaf | PaneSplit`)
- `pane-store.ts`: Zustand store with split/close/resize/cycle operations as pure tree manipulation
- `PaneContainer.tsx`: Recursive render using Allotment for splits
- `Pane.tsx`: Header + LogView (or empty state)
- `PaneHeader.tsx`: File name, follow toggle, status, split/close buttons

### Phase 4: Virtualized Log View
- `log-store.ts`: Zustand store with `Map<paneId, { lines, followMode, ... }>`. Trim front of array when exceeding maxLines.
- Wire IPC `onFileLines` events to log store
- `LogView.tsx`: @tanstack/react-virtual with fixed row height (monospace, no wrapping), 50-row overscan
- `LogLine.tsx`: React.memo'd, renders plain text + highlight spans + search hits
- `useFollowMode.ts`: Auto-scroll on new lines when enabled; detect scroll-up to auto-pause; resume on scroll to bottom

### Phase 5: File Opening (Dialog + Drag & Drop)
- File open dialog in main (multiselect, log/txt/all filters)
- WorkspaceBar with "Open File" button and file chips
- Drag-and-drop onto panes with visual drop zone indicator
- Full flow: open -> startTail -> lines stream -> LogView renders
- Pane cleanup: close -> stopTail -> remove from stores

### Phase 6: Highlight Engine
- `highlight-engine.ts`: Pure functions — `compileRules()` (once on change), `highlightLine(text, compiled) -> HighlightSpan[]`. String patterns use indexOf, regex pre-compiled. Priority-based overlap resolution.
- `highlight-store.ts`: Zustand store with rules + cached compiled regexes
- Update LogLine to apply highlight spans via `useMemo`
- HighlightsManager panel: add/edit/delete rules, color pickers, enable/disable, priority ordering

### Phase 7: Search
- `search-store.ts`: Per-pane state (query, regex/case toggles, matches, currentIndex)
- Search runs in a **Web Worker** to avoid blocking UI on 100k lines
- SearchBar: floating overlay (Ctrl+F), input + toggles + match count + next/prev
- LogLine: overlay search match highlights (yellow) and current match (orange)
- Keyboard: F3/Shift+F3 for next/prev, Escape to close

### Phase 8: Theming
- CSS custom properties for light/dark in `globals.css`
- `useTheme.ts`: Applies `.dark` class on `<html>`, listens to OS `prefers-color-scheme` changes in auto mode
- ThemeToggle component: cycles light -> dark -> auto
- `config-store.ts`: Persists theme preference

### Phase 9: Persistence
- `schemas.ts`: Zod schemas for config.json and session.json with defaults and type exports
- `config-store.ts` (main): Load/save to `%APPDATA%/cool-log-viewer/config.json` with atomic write (temp + rename)
- `session-store.ts` (main): Save pane layout, window geometry, per-pane state
- App lifecycle: load on ready, save on close (debounced 1s for config changes), save on before-quit
- Window geometry restore with on-screen validation

### Phase 10: Keyboard Shortcuts & Polish
- Global shortcuts: Ctrl+O (open), Alt+F (follow), Ctrl+F (find), F3/Shift+F3 (next/prev), Ctrl+\ (split h), Ctrl+- (split v), Ctrl+T (theme), Ctrl+Tab (switch pane), Ctrl+W (close pane)
- Application menu mirroring shortcuts
- Error/empty states: "Open a file or drag one here", file-not-found, permission denied
- Polish drag-drop visuals, file chips, tooltips

---

## Phase Dependencies

```
Phase 0 (Scaffold)
  └─> Phase 1 (IPC)
        ├─> Phase 2 (Tail Engine) ──┐
        ├─> Phase 3 (Pane Layout) ──┼─> Phase 4 (Log View) ──┬─> Phase 6 (Highlights)
        └─> Phase 8 (Theming) ──────┘                        ├─> Phase 7 (Search)
                                          Phase 5 (File Open) ┘   └─> Phase 9 (Persistence)
                                                                         └─> Phase 10 (Polish)
```

Phases 2, 3, 8 can be built in parallel after Phase 1. Phase 5 integrates them. Phases 6, 7, 9 can proceed in parallel after Phase 4.

---

## Key Design Decisions

### Tail Engine: Backward Chunk Reading
- Open fd, fstat for size, read 64KB chunks backward from EOF to collect last N lines
- Never load full file into memory — a 10GB file opens in ~1ms
- Ongoing tail: on change event, read from lastByteOffset to new EOF
- Truncation: new size < last size → emit event, reset reader
- Rotation: chokidar detects unlink + add → reopen at same path
- Batch lines for 50ms before IPC send to reduce overhead

### IPC Security
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Typed contextBridge API — renderer never touches ipcRenderer directly
- Invoke pattern for requests, send pattern for events (main → renderer)

### Virtualization: Fixed Row Height
- Monospace font, no line wrapping for MVP — enables fixed-height virtualization (fastest path)
- 50-row overscan for smooth scrolling
- Only visible lines get highlight/search processing (~50-100 lines at a time)

### Highlight Overlap Resolution
- Rules sorted by priority descending; higher priority wins at overlap
- Regexes compiled once on rule change, cached in store

---

## Verification Plan

1. **Unit tests** (Vitest): file-reader backward read, line-buffer ring behavior, highlight engine overlap resolution, pane-store tree operations
2. **Component tests** (@testing-library/react): LogLine rendering, SearchBar interaction, PaneHeader toggles
3. **E2E tests** (Playwright): app launch <2s, open file and see lines, follow mode auto-scrolls, search finds matches, split/close panes, session restores on restart
4. **Manual perf checks**: open 10 files (1-5GB each) without UI freeze, scroll 100k lines at ≥45fps with 10 highlight rules, tail latency ≤200ms
