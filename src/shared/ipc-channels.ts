export const IPC = {
  // File operations
  FILE_OPEN_DIALOG: 'file:open-dialog',
  FILE_START_TAIL: 'file:start-tail',
  FILE_STOP_TAIL: 'file:stop-tail',
  FILE_STOP_ALL: 'file:stop-all',
  FILE_LINES: 'file:lines',
  FILE_ERROR: 'file:error',
  FILE_TRUNCATED: 'file:truncated',

  // Config & session persistence
  CONFIG_LOAD: 'config:load',
  CONFIG_SAVE: 'config:save',
  SESSION_LOAD: 'session:load',
  SESSION_SAVE: 'session:save',

  // Menu actions (main -> renderer)
  MENU_OPEN_FILE: 'menu:open-file',
  MENU_CLOSE_PANE: 'menu:close-pane',
  MENU_FIND: 'menu:find',
  MENU_SPLIT_HORIZONTAL: 'menu:split-horizontal',
  MENU_SPLIT_VERTICAL: 'menu:split-vertical',
  MENU_TOGGLE_FOLLOW: 'menu:toggle-follow',
  MENU_TOGGLE_THEME: 'menu:toggle-theme',
  MENU_NEXT_PANE: 'menu:next-pane'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
