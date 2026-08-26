import { _electron as electron, expect, test } from '@playwright/test'

test('launches the main window', async ({}, testInfo) => {
  const app = await electron.launch({
    args: ['.', `--user-data-dir=${testInfo.outputPath('user-data')}`]
  })

  try {
    const window = await app.firstWindow()
    await expect(window).toHaveTitle('Cool Log Viewer')
    await expect(window.locator('#root')).toBeVisible()
  } finally {
    await app.close()
  }
})
