const { defineConfig } = require('@playwright/test');

const fs = require('fs');
const path = require('path');

function resolveResultDir() {
  const preferred = process.env.RESULT_DIR || '/test-results/current';

  try {
    fs.mkdirSync(path.dirname(preferred), { recursive: true });
    fs.accessSync(path.dirname(preferred), fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join(__dirname, 'test-results', 'current');
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

const resultDir = resolveResultDir();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(resultDir, 'results.json') }],
    ['html', {
      outputFolder: path.join(resultDir, 'report'),
      open: 'never'
    }]
  ],
  outputDir: path.join(resultDir, 'artifacts'),
  use: {
    baseURL: process.env.BASE_URL || 'https://example.com',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
