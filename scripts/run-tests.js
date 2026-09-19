const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function pad(value) {
  return String(value).padStart(2, '0');
}

const now = new Date();
const year = now.getFullYear();
const month = pad(now.getMonth() + 1);
const day = pad(now.getDate());

function resolveResultsRoot() {
  const preferredRoot = process.env.RESULTS_ROOT || '/test-results';
  const preferredPath = path.resolve(preferredRoot);

  try {
    fs.mkdirSync(preferredPath, { recursive: true });
    fs.accessSync(preferredPath, fs.constants.W_OK);
    return preferredPath;
  } catch {
    const fallbackRoot = path.resolve(__dirname, '..', 'test-results');
    fs.mkdirSync(fallbackRoot, { recursive: true });
    return fallbackRoot;
  }
}

const root = resolveResultsRoot();
const resultDir = path.join(root, String(year), month, day);

fs.mkdirSync(resultDir, { recursive: true });

process.env.RESULT_DIR = resultDir;

const startedAt = new Date().toISOString();

let exitCode = 0;

try {
  execFileSync(
    'npx',
    ['playwright', 'test'],
    {
      stdio: 'inherit',
      env: process.env
    }
  );
} catch (error) {
  exitCode = typeof error.status === 'number' ? error.status : 1;
}

const finishedAt = new Date().toISOString();

let results = {};
const resultsFile = path.join(resultDir, 'results.json');

if (fs.existsSync(resultsFile)) {
  try {
    results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  } catch {
    results = {};
  }
}

const stats = results.stats || {};

const metadata = {
  date: `${year}-${month}-${day}`,
  startedAt,
  finishedAt,
  status: exitCode === 0 ? 'passed' : 'failed',
  exitCode,
  total: stats.expected || 0,
  passed: stats.expected || 0,
  failed: stats.unexpected || 0,
  skipped: stats.skipped || 0,
  flaky: stats.flaky || 0,
  durationMs: stats.duration || 0
};

fs.writeFileSync(
  path.join(resultDir, 'metadata.json'),
  JSON.stringify(metadata, null, 2)
);

process.exit(exitCode);
