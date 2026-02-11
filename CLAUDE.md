# Cool Log Viewer — Implementation Progress

## What This Is
A fast, multi-pane log viewer for developers (Electron + React). Windows-first MVP: one file per pane, no tabs.

## Tech Stack
- **Shell:** Electron 34.x + electron-vite 3.x
- **UI:** React 19 + TypeScript 5, Zustand 5.x, @tanstack/react-virtual 3.x, allotment 1.x
- **Styling:** Tailwind CSS 4.x via `@tailwindcss/vite` plugin
- **File watching:** chokidar 4.x
- **Validation:** zod
- **Icons:** lucide-react
- **Testing:** Vitest (unit), @testing-library/react (component), Playwright (E2E)

## Commands
- `npm run dev` — Start Electron with HMR
- `npm run build` — Production build (outputs to `out/`)
- `npm test` — Run unit tests with Vitest
- `npx electron-vite build` — Build without packaging

## Implementation Status

### COMPLETED — Phase 0-9 Code Written (needs integration testing)

All source code for Phases 0–10 has been written in a single pass. The code **builds successfully** (`npx electron-vite build` passes). Unit tests for highlight-engine, pane-store, and line-buffer have been created and pass.

### What Was Built

#### Phase 0: Project Scaffolding ✅
- `package.json` with all dependencies
- `electron.vite.config.ts` — unified main/preload/renderer Vite config
- `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
- `electron-builder.yml`
- `vitest.config.ts`

#### Phase 1: IPC Layer ✅
- `src/shared/ipc-channels.ts` — all channel name constants
- `src/shared/ipc-types.ts` — typed request/response payloads
- `src/shared/constants.ts` — shared constants (MAX_LINES, ROW_HEIGHT, etc.)
- `src/preload/api.ts` — ElectronAPI type definition + global Window augment
- `src/preload/index.ts` — contextBridge with typed API (contextIsolation: true, nodeIntegration: false, sandbox: true)

#### Phase 2: Tail Engine ✅
- `src/main/tail-engine/file-reader.ts` — backward 64KB chunk reading from EOF, forward tail reading, truncation detection
- `src/main/tail-engine/line-buffer.ts` — ring buffer (100k lines default)
- `src/main/tail-engine/file-watcher.ts` — chokidar wrapper with debounce
- `src/main/tail-engine/tail-engine.ts` — manages Map<paneId, TailSession>, 50ms batch sends, progressive initial load in 1000-line chunks, file rotation/truncation handling
- `src/main/tail-engine/types.ts`

#### Phase 3: Pane Layout System ✅
- `src/renderer/types/pane.ts` — PaneNode = PaneLeaf | PaneSplit recursive tree
- `src/renderer/stores/pane-store.ts` — Zustand store with split/close/resize/cycle/setFilePath/setSizes
- `src/renderer/components/pane/PaneContainer.tsx` — recursive render using Allotment
- `src/renderer/components/pane/Pane.tsx` — header + LogView or empty state + drag-drop
- `src/renderer/components/pane/PaneHeader.tsx` — file name, line count, follow toggle, split/close buttons

#### Phase 4: Virtualized Log View ✅
- `src/renderer/stores/log-store.ts` — Zustand store with Map<paneId, {lines, followMode}>, front-trim at maxLines
- `src/renderer/components/log-view/LogView.tsx` — @tanstack/react-virtual, fixed 20px row height, 50-row overscan, auto-scroll to search matches
- `src/renderer/components/log-view/LogLine.tsx` — React.memo'd, renders highlight spans + search hits
- `src/renderer/components/log-view/useFollowMode.ts` — auto-scroll on new lines, detect scroll-up to pause

#### Phase 5: File Opening ✅
- File open dialog in main process (multiselect, log/txt/all filters)
- `src/renderer/components/workspace/WorkspaceBar.tsx` — Open button + file chips
- `src/renderer/components/workspace/FileChip.tsx`
- Drag-and-drop via `src/renderer/hooks/useDragDrop.ts`
- Full flow wired in App.tsx: open → startTail → lines stream → LogView renders

#### Phase 6: Highlight Engine ✅
- `src/renderer/lib/highlight-engine.ts` — pure functions: highlightLine() with overlap resolution
- `src/renderer/stores/highlight-store.ts` — rules + cached compiled regexes, auto-recompile on change
- `src/renderer/types/highlight.ts` — HighlightRule, HighlightSpan, CompiledRule
- `src/renderer/components/highlights/HighlightsManager.tsx` — add/delete rules, color picker, enable/disable
- `src/renderer/components/highlights/HighlightRuleRow.tsx`

#### Phase 7: Search ✅
- `src/renderer/stores/search-store.ts` — per-pane state (query, regex/case toggles, matches, currentIndex)
- `src/renderer/components/search/search-worker.ts` — Web Worker for off-thread search
- `src/renderer/components/search/useSearch.ts` — debounced 150ms, posts to worker
- `src/renderer/components/search/SearchBar.tsx` — floating overlay, input + toggles + match count + nav

#### Phase 8: Theming ✅
- `src/renderer/assets/styles/globals.css` — CSS custom properties for light/dark themes
- `src/renderer/assets/styles/log-line.css` — performance-critical log line styles
- `src/renderer/hooks/useTheme.ts` — applies .dark class, listens to OS prefers-color-scheme
- `src/renderer/components/settings/ThemeToggle.tsx` — cycles light → dark → auto
- `src/renderer/stores/config-store.ts` — theme + font + maxLines

#### Phase 9: Persistence ✅
- `src/main/persistence/schemas.ts` — Zod schemas for config.json and session.json
- `src/main/persistence/config-store.ts` — load/save with atomic write (temp + rename)
- `src/main/persistence/session-store.ts` — load/save session
- `src/main/persistence/migrations.ts` — version-based migration framework

#### Phase 10: Keyboard Shortcuts & Polish ✅
- `src/renderer/hooks/useKeyboardShortcuts.ts` — Ctrl+O, Ctrl+F, F3, Alt+F, Ctrl+\, Ctrl+-, Ctrl+W, Ctrl+Tab, Ctrl+T
- `src/main/menu.ts` — app menu mirroring shortcuts
- Empty states with "Open a file or drag one here" + styled drop zones
- `src/renderer/components/common/` — Button, Input, Toggle, Tooltip

#### Supporting Files ✅
- `src/main/index.ts` — app entry, window creation, IPC registration
- `src/main/ipc-handlers.ts` — all ipcMain.handle registrations
- `src/main/window-manager.ts` — window geometry save/restore with on-screen validation
- `src/main/utils/paths.ts` — %APPDATA% paths
- `src/main/utils/logger.ts`
- `src/renderer/App.tsx` — top layout + all IPC event wiring + config load/save
- `src/renderer/main.tsx` — React root
- `src/renderer/index.html`
- `src/renderer/lib/ipc-client.ts` — typed window.electronAPI wrapper
- `src/renderer/hooks/useIpc.ts` — typed event subscription hook

### Tests Written ✅
- `tests/unit/renderer/highlight-engine.test.ts` (11 tests)
- `tests/unit/renderer/pane-store.test.ts` (13 tests)
- `tests/unit/main/line-buffer.test.ts` (14 tests)

### Bugs Fixed ✅
- **file-reader.ts** — Moved `fs.close` import to top-level instead of `require()` in finally blocks
- **useSearch.ts** — Added missing `setIsSearching(false)` cleanup when search query is cleared
- **useFollowMode.ts** — Fixed redundant condition that caused scroll on line count decrease
- **App.tsx** — Fixed config type assertion to use `AppConfig` instead of invalid `Parameters<>` hack
- **App.tsx** — Fixed config save debounce (Zustand subscribe doesn't use listener return value as cleanup)
- **App.tsx** — Implemented session restore: loads pane layout on startup, re-starts tails for open files
- **App.tsx** — Implemented session save on `beforeunload`
- **ipc-handlers.ts** — Added try-catch around webContents.send to handle window destruction race

### Test Fixtures ✅
- `resources/test-fixtures/small.log` — 26-line sample log
- `resources/test-fixtures/generate-medium-log.js` — generates `medium.log` (100k lines, ~8.5MB)

### Still Needs Doing

1. **Integration testing** — Run `npm run dev` to verify the full app works end-to-end in Electron
2. **Fix any runtime issues** — The code builds but hasn't been tested in a running Electron window yet
3. **E2E tests** — Playwright tests not yet written

## Project Structure
```
src/
├── main/                       # Electron main process
│   ├── index.ts                # App entry
│   ├── window-manager.ts       # Window geometry
│   ├── ipc-handlers.ts         # All ipcMain.handle registrations
│   ├── menu.ts                 # App menu
│   ├── tail-engine/            # File tailing core
│   │   ├── tail-engine.ts
│   │   ├── file-reader.ts
│   │   ├── file-watcher.ts
│   │   ├── line-buffer.ts
│   │   └── types.ts
│   ├── persistence/            # Config & session
│   │   ├── config-store.ts
│   │   ├── session-store.ts
│   │   ├── schemas.ts
│   │   └── migrations.ts
│   └── utils/
│       ├── paths.ts
│       └── logger.ts
├── preload/
│   ├── index.ts                # contextBridge
│   └── api.ts                  # ElectronAPI type
├── renderer/
│   ├── index.html
│   ├── main.tsx
│   ├── App.tsx                 # Top layout + IPC wiring
│   ├── assets/styles/
│   │   ├── globals.css         # Tailwind + theme CSS vars
│   │   └── log-line.css
│   ├── components/
│   │   ├── workspace/          # WorkspaceBar, FileChip
│   │   ├── pane/               # PaneContainer, Pane, PaneHeader
│   │   ├── log-view/           # LogView, LogLine, useFollowMode
│   │   ├── search/             # SearchBar, useSearch, search-worker
│   │   ├── highlights/         # HighlightsManager, HighlightRuleRow
│   │   ├── settings/           # ThemeToggle
│   │   └── common/             # Button, Input, Toggle, Tooltip
│   ├── stores/
│   │   ├── pane-store.ts
│   │   ├── log-store.ts
│   │   ├── search-store.ts
│   │   ├── highlight-store.ts
│   │   └── config-store.ts
│   ├── hooks/
│   │   ├── useIpc.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useTheme.ts
│   │   └── useDragDrop.ts
│   ├── lib/
│   │   ├── highlight-engine.ts
│   │   ├── ipc-client.ts
│   │   └── constants.ts
│   └── types/
│       ├── pane.ts
│       ├── log.ts
│       ├── highlight.ts
│       └── config.ts
└── shared/
    ├── ipc-channels.ts
    ├── ipc-types.ts
    └── constants.ts
```
