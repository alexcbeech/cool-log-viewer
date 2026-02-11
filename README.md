# Cool Log Viewer

A fast, multi-pane log file viewer built for developers who need to monitor and analyze log files in real time. View multiple log files side by side, search through them, highlight patterns, and watch them update live.

## Features

- **Multi-pane layout** — Split your view horizontally or vertically to monitor multiple log files at once. Drag the dividers to resize panes.
- **Live file tailing** — Files are watched for changes and new lines appear automatically, just like `tail -f`.
- **Follow mode** — Automatically scrolls to the bottom as new lines arrive. Scroll up to pause; click the follow button to resume.
- **Search** — Find text in any pane with support for regular expressions and case-sensitive matching. Navigate between matches with F3.
- **Highlight rules** — Define color-coded patterns (plain text or regex) to make important log entries stand out at a glance.
- **Dark/Light/Auto themes** — Matches your OS setting by default, or choose manually.
- **Session restore** — Reopens your files and pane layout when you relaunch the app.
- **Drag and drop** — Drop log files directly onto a pane to open them.
- **Virtualized rendering** — Handles files with hundreds of thousands of lines without slowing down.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file(s) |
| `Ctrl+F` | Search in active pane |
| `F3` | Next search match |
| `Shift+F3` | Previous search match |
| `Escape` | Close search bar |
| `Alt+F` | Toggle follow mode |
| `Ctrl+\` | Split pane horizontally |
| `Ctrl+-` | Split pane vertically |
| `Ctrl+W` | Close active pane |
| `Ctrl+Tab` | Cycle to next pane |
| `Ctrl+T` | Toggle theme |

## Prerequisites

Before you can run this application, you need to install the following software on your computer:

### 1. Node.js (version 18 or later)

Node.js is the runtime that powers this application.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** (Long Term Support) version — this is the large green button on the homepage
3. Run the installer and follow the prompts, accepting the default settings
4. To verify it installed correctly, open a terminal (Command Prompt or PowerShell on Windows) and type:
   ```
   node --version
   ```
   You should see a version number like `v20.x.x` or `v22.x.x`.

### 2. Git

Git is used to download the source code.

1. Go to [https://git-scm.com/downloads](https://git-scm.com/downloads)
2. Download and install for your operating system
3. During installation on Windows, the default settings are fine
4. To verify, open a terminal and type:
   ```
   git --version
   ```

## Installation

Open a terminal (Command Prompt or PowerShell on Windows) and run the following commands one at a time:

### Step 1: Download the source code

```bash
git clone https://github.com/alexcbeech/cool-log-viewer.git
```

### Step 2: Navigate into the project folder

```bash
cd cool-log-viewer
```

### Step 3: Install dependencies

This downloads all the libraries the application needs. It may take a few minutes the first time.

```bash
npm install
```

You may see some warnings during installation — these are generally safe to ignore as long as the command completes without errors.

## Running the Application

### Development mode (recommended for local use)

This starts the application with hot-reload, meaning changes to the code are reflected immediately:

```bash
npm run dev
```

The application window will open automatically. You can close the terminal or press `Ctrl+C` in the terminal to stop it.

### Production build

To create an optimized build:

```bash
npm run build
```

The compiled output is written to the `out/` folder.

### Packaged installer (Windows)

To create a distributable Windows installer:

```bash
npm run dist
```

This generates installers in the `dist/` folder:
- **NSIS installer** (`.exe`) — A standard Windows setup wizard
- **Portable** (`.exe`) — A standalone executable that runs without installation

## Usage

### Opening files

There are three ways to open a log file:

1. **Click "Open"** in the toolbar (or press `Ctrl+O`), then select one or more files from the file picker
2. **Drag and drop** a file from Windows Explorer directly onto a pane
3. **Relaunch the app** — it remembers which files were open from your last session

### Splitting panes

To view multiple files side by side:

1. Click the split button in a pane's header bar (the two-rectangle icons), or use `Ctrl+\` for horizontal split and `Ctrl+-` for vertical split
2. Open a different file in the new pane
3. Drag the divider between panes to resize them
4. Close a pane with the X button or `Ctrl+W`

### Searching

1. Press `Ctrl+F` to open the search bar in the active pane
2. Type your search query
3. Use the toggle buttons to enable regex or case-sensitive matching
4. Press `F3` to jump to the next match, `Shift+F3` for the previous match
5. Press `Escape` to close the search bar

### Highlighting

1. Click the highlighter icon in the bottom-left corner of the app
2. Click "Add Rule" to create a new highlight rule
3. Enter a pattern (text or regex), choose a color, and toggle it on/off
4. Matching text in all panes is highlighted automatically

### Theming

Click the theme icon in the bottom-right corner to cycle between Light, Dark, and Auto (follows your OS setting).

## Troubleshooting

### "npm install" fails

- Make sure you have Node.js 18 or later: `node --version`
- Try deleting the `node_modules` folder and `package-lock.json`, then run `npm install` again
- On Windows, run your terminal as Administrator if you see permission errors

### The app window doesn't open

- Check the terminal for error messages
- Try running `npx electron-vite build` first, then `npm run dev`

### Files don't update in real time

- Make sure "Follow mode" is enabled (the down-arrow icon in the pane header should be highlighted)
- If you scrolled up, follow mode pauses automatically. Click the follow button or scroll to the bottom to re-enable it.

### GPU cache errors in the terminal

You may see errors like `Unable to move the cache: Access is denied`. These are harmless Electron GPU cache warnings and do not affect the application.

## Running Tests

To run the unit test suite:

```bash
npm test
```

To run tests in watch mode (re-runs on file changes):

```bash
npm run test:watch
```

## Tech Stack

- [Electron](https://www.electronjs.org/) — Desktop application framework
- [React](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) — Type-safe JavaScript
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
- [TanStack Virtual](https://tanstack.com/virtual) — Virtualized list rendering
- [Allotment](https://github.com/johnwalley/allotment) — Resizable split panes
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [chokidar](https://github.com/paulmillr/chokidar) — File watching
- [Vitest](https://vitest.dev/) — Unit testing

## License

This project is for personal/internal use.
