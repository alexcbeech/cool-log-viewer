# Cool Log Viewer - Improvement Report

Investigation Date: Sunday, February 22nd, 2026  
Task: Investigate possible improvements to the Cool Log Viewer app

---

## Current State Summary

The Cool Log Viewer is a well-architected Electron + React application for monitoring log files:

- **Multi-pane layout** with resizable splits (Allotment)
- **Live file tailing** with backward chunk reading (handles 10GB+ files)
- **Virtualized rendering** (TanStack Virtual) for smooth scrolling with 100k+ lines
- **Search** with regex/case-sensitive support and F3 navigation
- **Highlight rules** with priority-based overlap resolution
- **Dark/Light/Auto themes** with OS detection
- **Session persistence** for pane layout and open files
- **Keyboard shortcuts** for all major actions
- **Polling-based file watching** (recently fixed for Linux reliability)

---

## Identified Improvement Opportunities

### 1. **Search Performance Optimization** (HIGH PRIORITY)
**Current:** Search runs in the renderer process on the main thread  
**Issue:** With 100k+ lines and complex regex, UI can freeze  
**Solution:** Move search to Web Worker (search-worker.ts exists but appears unused)

### 2. **Export/Copy Functionality** (MEDIUM PRIORITY)
**Current:** No way to export or copy log content  
**Use Case:** Users often need to share log snippets or save filtered views  
**Solution:** Add "Copy Selection", "Export to File", "Copy Current Line" buttons

### 3. **Line Numbers** (MEDIUM PRIORITY)
**Current:** No line number display  
**Use Case:** Critical for debugging ("check line 4532")  
**Solution:** Add optional line number gutter with configurable offset (for tail views)

### 4. **Go to Line Feature** (MEDIUM PRIORITY)
**Current:** No way to jump to a specific line  
**Use Case:** "Go to line 5000" from error reports  
**Solution:** Ctrl+G shortcut with line number input

### 5. **Filtering (Show Only Matches)** (HIGH PRIORITY)
**Current:** Only highlighting exists - no way to filter  
**Use Case:** "Show me only ERROR lines" - hide non-matching lines  
**Solution:** Add "Filter Mode" toggle alongside highlight rules

### 6. **Bookmark/Annotation System** (MEDIUM PRIORITY)
**Current:** No way to mark important lines  
**Use Case:** Flagging critical errors or milestones during debugging  
**Solution:** Click line number to bookmark, sidebar showing all bookmarks

### 7. **Structured Log Support (JSON)** (HIGH PRIORITY)
**Current:** JSON logs displayed as raw text  
**Use Case:** Modern apps output JSON logs - hard to read as plain text  
**Solution:** Auto-detect JSON, provide collapsible tree view or formatted display

### 8. **File Information Panel** (LOW PRIORITY)
**Current:** Only filename shown in pane header  
**Use Case:** File size, last modified, line count, encoding info helpful  
**Solution:** Status bar expansion with file metadata

### 9. **Font Family Selection** (LOW PRIORITY)
**Current:** Only font size adjustable  
**Use Case:** Developers have preferred coding fonts (Fira Code, JetBrains Mono)  
**Solution:** Add font family dropdown to settings

### 10. **Clear Pane Without Closing** (MEDIUM PRIORITY)
**Current:** Must close and reopen pane to clear content  
**Use Case:** "Clear and start fresh" while keeping same file  
**Solution:** Add "Clear" button to pane header or keyboard shortcut

### 11. **Memory Usage Indicator** (LOW PRIORITY)
**Current:** No visibility into resource usage  
**Use Case:** Opening many large files could exhaust memory  
**Solution:** Optional status bar showing line count, memory usage per pane

### 12. **Test Coverage Expansion** (MEDIUM PRIORITY)
**Current:** Tests exist for line-buffer and highlight-engine  
**Gap:** No tests for file-reader, tail-engine, or component integration  
**Solution:** Add E2E tests for file opening, search, highlights, session restore

---

## Recommended Implementation Order

1. **Web Worker Search** - Immediate performance win
2. **Filtering** - High user value, builds on existing search
3. **Line Numbers** - Foundation for other features (bookmarks, go-to-line)
4. **JSON Log Support** - Differentiator feature for modern dev workflows
5. **Export/Copy** - Quality of life improvement
6. **Bookmarks** - Power user feature

---

## Code Quality Observations

**Strengths:**
- Clean separation of concerns (main/renderer processes)
- Good TypeScript coverage
- Virtualized rendering for performance
- Proper IPC security (contextIsolation, no nodeIntegration)
- Comprehensive PLAN.md documentation

**Areas for Improvement:**
- `highlightLine()` currently highlights entire line when pattern matches - could be enhanced to highlight only matching text
- No error boundaries in React components
- File watcher polling enabled (good for reliability) but could impact battery - consider making configurable

---

## Conclusion

The Cool Log Viewer is a solid, production-ready MVP with excellent architecture. The highest-impact improvements would be:

1. **Web Worker Search** - Prevent UI freezing
2. **Filtering Mode** - Transform from viewer to analysis tool
3. **JSON Log Support** - Essential for modern cloud-native development

These three features would significantly expand the app's utility while maintaining its performance characteristics.

---

Report generated by Fenn  
Repository: https://github.com/alexcbeech/cool-log-viewer
