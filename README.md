# Playwright Daily Report Dashboard

A Dockerized starter project for running Playwright tests daily, storing results by date, and viewing them through a monthly calendar UI.

## Architecture

- `playwright-runner`: runs Playwright tests and writes results to `/test-results/YYYY/MM/DD`
- `report-server`: serves the React frontend and exposes report APIs
- `./test-results`: host-mounted persistent storage

## Directory layout

```text
test-results/
└── 2026/
    └── 09/
        └── 17/
            ├── metadata.json
            ├── results.json
            ├── report/
            └── artifacts/
```

## Prerequisites

- Docker
- Docker Compose

## Start the dashboard

```bash
docker compose up --build -d report-server
```

Open:

```text
http://localhost:3000
```

## Run tests manually

```bash
docker compose run --rm playwright-runner
```

The result will be written to the date calculated inside the container.


## Timezone

The default timezone is:

```text
America/New_York
```

Change `TZ` in `docker-compose.yml` if required.

## Open a report

After a test run, select the corresponding date in the calendar. The UI displays:

- Total tests
- Passed tests
- Failed tests
- Skipped tests
- Duration
- Link to the Playwright HTML report
- Links to result JSON and artifacts

## Important production notes

1. Protect the report server if it is exposed publicly.
2. Add authentication before exposing test traces.
3. Consider object storage for long-term retention.
4. Add cleanup/retention logic for old reports.
5. Use a database if you need filtering across many projects or test suites.
