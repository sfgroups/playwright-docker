# AGENTS.md

## Project overview
This repository is a Dockerized Playwright reporting dashboard that runs daily tests, stores results by date, and renders a monthly calendar with report details and artifact links.

The project is designed to:
- run Playwright test suites
- save results under `test-results/YYYY/MM/DD`
- serve a calendar UI over the saved report data
- expose the HTML report, JSON results, and artifacts for each date
- show trace viewer links when traces exist

## Tech stack
- Node.js
- Playwright
- Express
- Docker / Docker Compose

## key folders
- `frontend/` — browser UI and calendar rendering
- `server/` — Express report API and static file serving
- `scheduler/` — scheduled run container configuration
- `scripts/` — local runner script
- `tests/` — Playwright tests
- `test-results/` — generated report artifacts and historical runs

## Local setup
Install dependencies:

```bash
npm install
cd server && npm install
```

Start the dashboard:

```bash
docker compose up --build -d report-server
```

Open the app at:

```text
http://localhost:3000
```

## Run tests locally
Use the project script:

```bash
npm test
```

This runs `scripts/run-tests.js`, which creates a date-based results directory and stores metadata and artifacts under `test-results`.

## Important behavior and constraints
- The app expects results under `/test-results` in Docker, but local runs may not have that path available.
- The runner should fall back to a workspace-local `test-results` folder when `/test-results` is not writable.
- Playwright traces should be retained in order to support trace viewing in the UI.
- The report API shape is expected to include:
  - `metadata`
  - `reportUrl`
  - `resultsUrl`
  - `artifactsUrl`
  - `traceUrl` (optional)
  - `traceViewerUrl` (optional)

## API endpoints
- `GET /api/calendar/:year/:month` — returns the report status for each day in the month
- `GET /api/report/:year/:month/:day` — returns the selected report metadata and artifact URLs
- `GET /api/health` — health-check endpoint

## Frontend behavior
The calendar UI should:
- list a month and day grid
- color a day according to run status (`passed`, `failed`, `unknown`)
- when clicked, fetch and render that day’s report details
- show an embedded HTML report preview and trace link when available

## Anti-patterns to avoid
- Do not hardcode `/test-results` without checking write access.
- Do not assume every run has a trace.zip file; only expose trace links when present.
- Do not break Docker behavior while fixing local execution.
- Do not create duplicate report URLs or serve stale frontend code after changes.

## Validation commands
Use these after changing the project:

```bash
npm test
npx playwright test tests/report-detail.spec.js --reporter=line
```

## Notes for AI agents
When modifying this project, prefer:
- preserving the date-based output structure
- keeping the Docker and local workflows compatible
- using existing `test-results` conventions and API contract
- verifying with the smallest relevant Playwright check before finishing
