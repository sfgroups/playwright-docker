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
    const status = report ? report.status : 'unknown';
    const selected = state.selected === key ? 'selected' : '';

    html += `
      <button class="day ${selected}" data-date="${key}">
        <div class="number">${day}</div>
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
    return '<p>Select a date to view its report.</p>';
  }

  if (!state.detail) {
    return '<p>No detailed report is available for this date.</p>';
  }

  const metadata = state.detail.metadata || {};

  function seconds(ms) {
    return `${Math.round((ms || 0) / 1000)}s`;
  }

  const reportPreview = state.detail.reportUrl
    ? `<div class="report-preview"><iframe src="${state.detail.reportUrl}" title="Daily Playwright report for ${state.selected}"></iframe></div>`
    : '<p>No HTML report is available for this date.</p>';

  const tracePreview = state.detail.traceViewerUrl
    ? `<div class="report-preview trace-preview"><iframe src="${state.detail.traceViewerUrl}" title="Playwright trace viewer for ${state.selected}"></iframe></div>`
    : '<p>No trace file available for this run.</p>';

  const traceLink = state.detail.traceViewerUrl
    ? `<a target="_blank" rel="noopener noreferrer" href="${state.detail.traceViewerUrl}">Open Trace Viewer</a>`
    : '<span class="muted">No trace file available for this run.</span>';

  return `
    <h2>Report: ${state.selected}</h2>
    <p>Status: <strong>${metadata.status || 'unknown'}</strong></p>
    <div class="stats">
      <div class="stat"><span>Total</span><strong>${metadata.total || 0}</strong></div>
      <div class="stat"><span>Passed</span><strong>${metadata.passed || 0}</strong></div>
      <div class="stat"><span>Failed</span><strong>${metadata.failed || 0}</strong></div>
      <div class="stat"><span>Skipped</span><strong>${metadata.skipped || 0}</strong></div>
      <div class="stat"><span>Duration</span><strong>${seconds(metadata.durationMs)}</strong></div>
    </div>
    ${reportPreview}
    ${tracePreview}
    <div class="links">
      <a target="_blank" rel="noopener noreferrer" href="${state.detail.reportUrl}">Open HTML Report</a>
      <a target="_blank" rel="noopener noreferrer" href="${state.detail.resultsUrl}">Open results.json</a>
      <a target="_blank" rel="noopener noreferrer" href="${state.detail.artifactsUrl}">Open artifacts</a>
      ${traceLink}
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
        <h1>Playwright Daily Reports</h1>
        <div class="controls">
          <button id="previous">Previous</button>
          <button id="today">Today</button>
          <button id="next">Next</button>
        </div>
      </div>

      <section class="calendar">
        <h2>${monthName(state.current)}</h2>
        <div class="weekdays">
          <div>Sun</div><div>Mon</div><div>Tue</div>
          <div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="grid">${renderCalendar()}</div>
      </section>

      <section class="detail">
        ${state.error ? `<p class="error">${state.error}</p>` : ''}
        ${renderDetail()}
      </section>
    </main>
  `;

  document.getElementById('previous').onclick = () => {
    state.current = new Date(
      state.current.getFullYear(),
      state.current.getMonth() - 1,
      1
    );
    state.selected = null;
    state.detail = null;
    loadMonth();
  };

  document.getElementById('next').onclick = () => {
    state.current = new Date(
      state.current.getFullYear(),
      state.current.getMonth() + 1,
      1
    );
    state.selected = null;
    state.detail = null;
    loadMonth();
  };

  document.getElementById('today').onclick = () => {
    state.current = new Date();
    state.selected = null;
    state.detail = null;
    loadMonth();
  };

  document.querySelectorAll('[data-date]').forEach(button => {
    button.onclick = () => loadDetail(button.dataset.date);
  });
}

loadMonth();
