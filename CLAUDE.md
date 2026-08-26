# Cool Log Viewer — Developer Guide

## What This Is
A fast, multi-pane log viewer for developers (Electron + React). Windows-first MVP: one file per pane, no tabs.

## Tech Stack
- **Shell:** Electron 44.x + electron-vite 3.x
- **UI:** React 19 + TypeScript 5, Zustand 5.x, @tanstack/react-virtual 3.x, allotment 1.x
- **Styling:** Tailwind CSS 4.x via `@tailwindcss/vite` plugin + inline styles for layout-critical components
- **File watching:** chokidar 4.x
- **Validation:** zod
- **Icons:** lucide-react
- **Testing:** Vitest (unit), @testing-library/react (component), Playwright (E2E — not yet written)

## Commands
- `npm run dev` — Start Electron with HMR
- `npm run build` — Production build (outputs to `out/`)
- `npm test` — Run unit tests with Vitest
- `npm run test:watch` — Run unit tests in watch mode
- `npm run dist` — Package for distribution (outputs to `dist/`)
- `npx electron-vite build` — Build without packaging

## Architecture Notes

### Pane Tree
The pane layout is a recursive binary tree (`PaneNode = PaneLeaf | PaneSplit`). Each leaf holds one file. Splits can be horizontal or vertical, rendered using the Allotment library.

**Important:** `replaceNode` and `removeNode` in `pane-store.ts` use a `replaced`/`removed` flag to ensure only one occurrence is affected per operation. This prevents tree corruption when a split's child shares an ID with the node being replaced (which happens during `splitPane`, where the original leaf becomes a child of the new split node).

### IPC & Security
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- All main↔renderer communication goes through typed IPC channels via `contextBridge`
- Preload exposes a typed `electronAPI` on `window`

### Tail Engine
The main process manages file tailing via `TailEngine` (one `TailSession` per pane). It reads from EOF backward in 64KB chunks for initial load, then watches via chokidar for appends. Lines are batched (50ms) and sent to the renderer.

### Close Pane Flow
Closing a pane is async: `App.tsx` calls `ipcClient.stopTail()` first, then cleans up the log store, then removes from the pane tree. The `stopTail` call is wrapped in try/catch so the pane always closes even if the tail was already stopped.

### Session Persistence
On close (`beforeunload`), the pane tree and active pane ID are saved to `%APPDATA%/cool-log-viewer/session.json`. On startup, the session is restored and tails are restarted for any files that were open. The pane ID counter is synced from restored IDs to prevent collisions.

## Project Structure
```
src/
├── main/                       # Electron main process
│   ├── index.ts                # App entry, window creation, IPC registration
│   ├── window-manager.ts       # Window geometry save/restore
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
│   ├── App.tsx                 # Top layout + IPC wiring + close/open flows
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
│   │   ├── pane-store.ts       # Pane tree operations (split/close/resize)
│   │   ├── log-store.ts        # Per-pane log lines + follow mode
│   │   ├── search-store.ts     # Per-pane search state
│   │   ├── highlight-store.ts  # Highlight rules + compiled regexes
│   │   └── config-store.ts     # Theme + font + maxLines
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

## Tests
- Renderer unit tests cover highlighting, pane layout, and partial-line replacement.
- Main-process unit tests cover buffering, UTF-8 line assembly, and file reads.
- `tests/e2e/app.spec.ts` verifies that the production build launches under Electron.

## Test Fixtures
- `resources/test-fixtures/small.log` — 26-line sample log
- `resources/test-fixtures/generate-medium-log.js` — generates `medium.log` (100k lines, ~8.5MB)

## Known Limitations
- Cross-platform packages must be built and smoke-tested on their target operating system.
- E2E coverage currently contains only a launch smoke test.
- No tab support — each pane holds exactly one file.
