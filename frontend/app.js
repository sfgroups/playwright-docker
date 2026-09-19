const state = {
  current: new Date(),
  selected: null,
  reports: [],
  detail: null,
  error: null
};

const app = document.getElementById('app');

function pad(value) {
  return String(value).padStart(2, '0');
}

function dateKey(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function monthName(date) {
  return date.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric'
  });
}

function reportFor(date) {
  return state.reports.find(item => item.date === date);
}

async function loadMonth() {
  state.error = null;
  const year = state.current.getFullYear();
  const month = state.current.getMonth() + 1;

  try {
    const response = await fetch(`/api/calendar/${year}/${month}`);
    if (!response.ok) throw new Error('Could not load calendar');
    state.reports = await response.json();
  } catch (error) {
    state.error = error.message;
    state.reports = [];
  }

  render();
}

async function loadDetail(date) {
  state.selected = date;
  state.detail = null;
  state.error = null;
  render();

  const [year, month, day] = date.split('-');

  try {
    const response = await fetch(`/api/report/${year}/${month}/${day}`);
    if (!response.ok) throw new Error('No report found for this date');
    state.detail = await response.json();
  } catch (error) {
    state.error = error.message;
  }

  render();
}

function renderCalendar() {
  const year = state.current.getFullYear();
  const month = state.current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(year, month + 1, day);
    const report = reportFor(key);
    const status = report ? report.status : 'none';
    const selected = state.selected === key ? 'selected' : '';

    html += `
      <button class="day-btn ${selected}" data-date="${key}">
        <span class="number">${day}</span>
        <span class="badge ${status}">
          ${report ? status : 'No run'}
        </span>
      </button>
    `;
  }

  return html;
}


function renderDetail() {
  if (!state.selected) {
    return `<div class="empty-state"><p>Select a date from the calendar to inspect the test run.</p></div>`;
  }

  if (!state.detail) {
    return `<div class="empty-state"><p>No detailed report record found for <strong>${state.selected}</strong>.</p></div>`;
  }

  const metadata = state.detail.metadata || {};
  const seconds = (ms) => `${Math.round((ms || 0) / 1000)}s`;

  return `
    <h3>Report: ${state.selected}</h3>
    <p style="margin-top: 4px; color: var(--text-muted); font-size: 0.85rem;">
      Status: <span class="badge ${metadata.status || 'none'}" style="display:inline-flex; width:auto; padding:2px 8px;">${metadata.status || 'unknown'}</span>
    </p>

    <div class="stats-grid">
      <div class="stat-card"><span>Total Tests</span><strong>${metadata.total || 0}</strong></div>
      <div class="stat-card"><span>Duration</span><strong>${seconds(metadata.durationMs)}</strong></div>
      <div class="stat-card"><span style="color:var(--status-passed)">Passed</span><strong>${metadata.passed || 0}</strong></div>
      <div class="stat-card"><span style="color:var(--status-failed)">Failed</span><strong>${metadata.failed || 0}</strong></div>
    </div>

    ${state.detail.reportUrl ? `
      <div class="preview-box">
        <iframe src="${state.detail.reportUrl}" title="Daily Playwright report"></iframe>
      </div>` : ''}

    <div class="links-group">
      ${state.detail.reportUrl ? `<a target="_blank" href="${state.detail.reportUrl}">↗ Open Full HTML Report</a>` : ''}
      ${state.detail.traceViewerUrl ? `<a target="_blank" href="${state.detail.traceViewerUrl}">↗ Open Trace Viewer</a>` : ''}
      ${state.detail.artifactsUrl ? `<a target="_blank" href="${state.detail.artifactsUrl}">↗ View Artifacts</a>` : ''}
    </div>
  `;
}


function renderTraceLink(traceUrl) {
  if (!traceUrl) {
    return '';
  }

  return `
    <div class="trace-section">
      <a href="${traceUrl}" download="trace.zip">
        Download Playwright trace
      </a>
      <p>Open the downloaded trace.zip with Playwright Trace Viewer.</p>
    </div>
  `;
}

function render() {
  app.innerHTML = `
    <main class="container">
      <div class="header">
        <h1>Playwright Execution Calendar</h1>
        <div class="controls">
          <button id="previous">‹ Prev</button>
          <button id="today">Today</button>
          <button id="next">Next ›</button>
        </div>
      </div>

      <div class="dashboard-grid">
        <section class="calendar">
          <div class="calendar-header">
            <h2>${monthName(state.current)}</h2>
          </div>
          <div class="weekdays">
            <div>Sun</div><div>Mon</div><div>Tue</div>
            <div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div class="grid">${renderCalendar()}</div>
        </section>

        <section class="detail">
          ${state.error ? `<p class="error" style="color:var(--status-failed); margin-bottom:1rem;">${state.error}</p>` : ''}
          ${renderDetail()}
        </section>
      </div>
    </main>
  `;

  // Attach Navigation Listeners
  document.getElementById('previous').onclick = () => {
    state.current = new Date(state.current.getFullYear(), state.current.getMonth() - 1, 1);
    state.selected = null; state.detail = null; loadMonth();
  };

  document.getElementById('next').onclick = () => {
    state.current = new Date(state.current.getFullYear(), state.current.getMonth() + 1, 1);
    state.selected = null; state.detail = null; loadMonth();
  };

  document.getElementById('today').onclick = () => {
    state.current = new Date();
    state.selected = null; state.detail = null; loadMonth();
  };

  document.querySelectorAll('[data-date]').forEach(button => {
    button.onclick = () => loadDetail(button.dataset.date);
  });
}
loadMonth();
