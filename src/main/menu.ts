import { Menu, BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'

export function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: (): void => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send(IPC.MENU_OPEN_FILE)
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Close Pane',
          accelerator: 'CmdOrCtrl+W',
          click: (): void => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send(IPC.MENU_CLOSE_PANE)
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: (): void => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send(IPC.MENU_FIND)
            }
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Split Horizontal',
          accelerator: 'CmdOrCtrl+\\',
          click: (): void => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send(IPC.MENU_SPLIT_HORIZONTAL)
            }
          }
        },
        {
          label: 'Split Vertical',
          accelerator: 'CmdOrCtrl+-',
          click: (): void => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send(IPC.MENU_SPLIT_VERTICAL)
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Follow Mode',
          accelerator: 'Alt+F',
          click: (): void => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send(IPC.MENU_TOGGLE_FOLLOW)
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+T',
          click: (): void => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send(IPC.MENU_TOGGLE_THEME)
            }
          }
        },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
