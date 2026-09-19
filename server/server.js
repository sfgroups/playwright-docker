const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const RESULTS_ROOT = process.env.RESULTS_ROOT || '/test-results';

function pad(value) {
  return String(value).padStart(2, '0');
}

function safeSegment(value) {
  return /^\d{1,4}$/.test(String(value));
}

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function dayDir(year, month, day) {
  return path.join(
    RESULTS_ROOT,
    String(year),
    pad(month),
    pad(day)
  );
}

function findTraceFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const nextPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(nextPath);
        continue;
      }

      if (/trace.*\.zip$/i.test(entry.name) || /^trace.*\.zip$/i.test(entry.name)) {
        files.push(nextPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/calendar/:year/:month', (req, res) => {
  const { year, month } = req.params;

  if (!safeSegment(year) || !safeSegment(month)) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const monthDir = path.join(RESULTS_ROOT, year, pad(month));
  if (!fs.existsSync(monthDir)) return res.json([]);

  const days = fs.readdirSync(monthDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^\d{2}$/.test(entry.name))
    .map(entry => {
      const metadataPath = path.join(monthDir, entry.name, 'metadata.json');
      const metadata = readJson(metadataPath, {
        date: `${year}-${pad(month)}-${entry.name}`,
        status: 'unknown'
      });

      return {
        date: metadata.date || `${year}-${pad(month)}-${entry.name}`,
        status: metadata.status || 'unknown',
        total: metadata.total || 0,
        passed: metadata.passed || 0,
        failed: metadata.failed || 0,
        skipped: metadata.skipped || 0,
        durationMs: metadata.durationMs || 0
      };
    });

  res.json(days);
});

app.get('/api/report/:year/:month/:day', (req, res) => {
  const { year, month, day } = req.params;

  if (![year, month, day].every(safeSegment)) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const dir = dayDir(year, month, day);
  if (!fs.existsSync(dir)) {
    return res.status(404).json({ error: 'No report for this date' });
  }

  const metadata = readJson(path.join(dir, 'metadata.json'), {});
  const relativeBase = `/reports/${year}/${pad(month)}/${pad(day)}`;
  const traceFile = findTraceFiles(path.join(dir, 'artifacts'))[0];
  const traceUrl = traceFile
    ? `${relativeBase}/artifacts/${path.relative(path.join(dir, 'artifacts'), traceFile).replace(/\\/g, '/')}`
    : null;
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const traceViewerUrl = traceUrl
    ? `https://trace.playwright.dev/?trace=${encodeURIComponent(`${protocol}://${host}${traceUrl}`)}`
    : null;

  res.json({
    metadata,
    reportUrl: `${relativeBase}/report/index.html`,
    resultsUrl: `${relativeBase}/results.json`,
    artifactsUrl: `${relativeBase}/artifacts/`,
    traceUrl,
    traceViewerUrl
  });
});

app.use('/reports', express.static(RESULTS_ROOT));

app.use(express.static(path.join('/app', 'frontend')));

app.get('*', (_req, res) => {
  res.sendFile(path.join('/app', 'frontend', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Report server listening on port ${PORT}`);
});
