const { defineConfig } = require('@playwright/test')
module.exports = defineConfig({
  testDir: './tests/browser', workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:3110', channel: 'chrome', trace: 'retain-on-failure' },
  webServer: { command: 'node tests/browser-server.cjs', url: 'http://127.0.0.1:3110/shop', timeout: 120000, reuseExistingServer: false },
})
