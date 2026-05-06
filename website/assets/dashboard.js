/* ============================================================
   AUDTHEIA — RESEARCHER DASHBOARD
   website/assets/dashboard.js
   Session 5
   All dashboard logic: settings, Airtable fetch, data render.
   No dependencies on demo.js, landing.js, or nav.js.
   ============================================================ */

'use strict';

/* ── Storage key constants ──────────────────────────────────────────────── */
const KEY = Object.freeze({
  pat:          'audtheia_airtable_pat',
  baseId:       'audtheia_airtable_base_id',
  tableSpecies: 'audtheia_table_species',
  tableMapping: 'audtheia_table_mapping',
  tableReports: 'audtheia_table_reports',
});

const AIRTABLE_API = 'https://api.airtable.com/v0';

/* ── Pagination state ───────────────────────────────────────────────────── */
let speciesOffset = null;

/* ── Tab loaded flags ───────────────────────────────────────────────────── */
const tabsLoaded = { species: false, mapping: false, reports: false };

/* ── DOM references ─────────────────────────────────────────────────────── */
const elPat          = document.getElementById('settings-pat');
const elBaseId       = document.getElementById('settings-base-id');
const elTableSpecies = document.getElementById('settings-table-species');
const elTableMapping = document.getElementById('settings-table-mapping');
const elTableReports = document.getElementById('settings-table-reports');
const elSave         = document.getElementById('settings-save');
const elClear        = document.getElementById('settings-clear');
const elMsg          = document.getElementById('settings-msg');
const elNoCreds      = document.getElementById('dash-no-creds');
const elContent      = document.getElementById('dash-content');
const elSpeciesGrid  = document.getElementById('species-grid');
const elMappingGrid  = document.getElementById('mapping-grid');
const elReportsList  = document.getElementById('reports-list');
const elLoadMore     = document.getElementById('species-load-more');
const elBtnLoadMore  = document.getElementById('btn-load-more');
const dashTabs       = document.querySelectorAll('.dash-tab');

const PANELS = {
  species: document.getElementById('panel-species'),
  mapping: document.getElementById('panel-mapping'),
  reports: document.getElementById('panel-reports'),
};

/* ── Credential helpers ─────────────────────────────────────────────────── */
function getCredentials() {
  return {
    pat:          localStorage.getItem(KEY.pat)          || '',
    baseId:       localStorage.getItem(KEY.baseId)       || '',
    tableSpecies: localStorage.getItem(KEY.tableSpecies) || '',
    tableMapping: localStorage.getItem(KEY.tableMapping) || '',
    tableReports: localStorage.getItem(KEY.tableReports) || '',
  };
}

function hasCredentials() {
  const c = getCredentials();
  return !!(c.pat && c.baseId);
}

function populateSettingsFields() {
  const c = getCredentials();
  elPat.value          = c.pat;
  elBaseId.value       = c.baseId;
  elTableSpecies.value = c.tableSpecies;
  elTableMapping.value = c.tableMapping;
  elTableReports.value = c.tableReports;
}

/* ── Settings message ───────────────────────────────────────────────────── */
let msgTimer = null;

function showMsg(text, type) {
  /* type: 'success' | 'error' */
  elMsg.textContent = text;
  elMsg.className   = 'settings-msg settings-msg--' + type;
  elMsg.hidden      = false;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(function () { elMsg.hidden = true; }, 5000);
}

/* ── Settings event handlers ────────────────────────────────────────────── */
elSave.addEventListener('click', function () {
  const pat    = elPat.value.trim();
  const baseId = elBaseId.value.trim();

  if (!pat || !baseId) {
    showMsg(
      'Personal Access Token and Base ID are required to connect to Airtable.',
      'error'
    );
    return;
  }

  localStorage.setItem(KEY.pat,          pat);
  localStorage.setItem(KEY.baseId,       baseId);
  localStorage.setItem(KEY.tableSpecies, elTableSpecies.value.trim());
  localStorage.setItem(KEY.tableMapping, elTableMapping.value.trim());
  localStorage.setItem(KEY.tableReports, elTableReports.value.trim());

  showMsg('Credentials saved to local storage on this device.', 'success');
  initDashboard();
});

elClear.addEventListener('click', function () {
  Object.values(KEY).forEach(function (k) { localStorage.removeItem(k); });
  elPat.value          = '';
  elBaseId.value       = '';
  elTableSpecies.value = '';
  elTableMapping.value = '';
  elTableReports.value = '';
  showMsg('Credentials cleared from local storage.', 'success');
  showNoCreds();
});

/* ── Airtable fetch ─────────────────────────────────────────────────────── */

/*
 * Fetches a single page of records from an Airtable table.
 * Returns the raw Airtable response object: { records, offset? }
 * Throws on non-200 HTTP status or network failure.
 */
async function fetchAirtablePage(tableId, offset) {
  const creds = getCredentials();
  let url = AIRTABLE_API + '/' + creds.baseId + '/' + tableId;
  if (offset) url += '?offset=' + encodeURIComponent(offset);

  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + creds.pat },
  });

  if (!res.ok) {
    let message = 'HTTP ' + res.status;
    try {
      const body = await res.json();
      if (body && body.error && body.error.message) {
        message = body.error.message;
      }
    } catch (_) { /* ignore JSON parse failure on error body */ }
    throw new Error(message);
  }

  return res.json();
}

/*
 * Fetches all records from a table by following Airtable pagination offsets.
 * Stops after maxPages pages (default 10 = 1,000 records) to avoid runaway
 * API usage. Returns { records: Array, truncated: Boolean }.
 */
async function fetchAllRecords(tableId, maxPages) {
  maxPages = maxPages || 10;
  const records  = [];
  let offset     = null;
  let page       = 0;
  let truncated  = false;

  do {
    const data = await fetchAirtablePage(tableId, offset);
    const batch = data.records || [];
    for (let i = 0; i < batch.length; i++) records.push(batch[i]);
    offset = data.offset || null;
    page++;
    if (page >= maxPages && offset) {
      truncated = true;
      break;
    }
  } while (offset);

  return { records: records, truncated: truncated };
}

/* ── UI state helpers ───────────────────────────────────────────────────── */
function showNoCreds() {
  elNoCreds.hidden = false;
  elContent.hidden = true;
}

function showContent() {
  elNoCreds.hidden = true;
  elContent.hidden = false;
}

function showSkeleton(container, count) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html +=
      '<div class="dash-skeleton" aria-hidden="true">' +
        '<div class="dash-skeleton-line"></div>' +
        '<div class="dash-skeleton-line dash-skeleton-line--mid"></div>' +
        '<div class="dash-skeleton-line dash-skeleton-line--short"></div>' +
      '</div>';
  }
  container.innerHTML = html;
}

function showError(container, message) {
  container.innerHTML =
    '<div class="dash-inline-error">' +
      '<span class="dash-inline-error-icon" aria-hidden="true">&#x26A0;</span>' +
      '<span>' + escHtml(message) +
        ' &mdash; Check your credentials and table IDs in Settings.' +
      '</span>' +
    '</div>';
}

function showEmpty(container, label) {
  container.innerHTML =
    '<div class="dash-empty">' +
      '<span class="dash-empty-label">No records in ' + escHtml(label) + '.</span>' +
    '</div>';
}

/* ── HTML escaping ──────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* ── Field value renderer ───────────────────────────────────────────────── */
/*
 * Converts any Airtable field value to a safe HTML string for display.
 * Handles: null/undefined, boolean, number, string, URL string,
 * array (linked records, multi-select), Airtable attachment object.
 */
function renderFieldValue(value) {
  if (value === null || value === undefined) {
    return '<span class="field-null">\u2014</span>';
  }

  if (typeof value === 'boolean') {
    return value
      ? '<span class="field-bool field-bool--true">Yes</span>'
      : '<span class="field-bool field-bool--false">No</span>';
  }

  if (typeof value === 'number') {
    return '<span class="field-num">' + value.toLocaleString() + '</span>';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '<span class="field-null">\u2014</span>';
    return value.map(function (v) {
      if (v && typeof v === 'object') {
        /* Airtable attachment objects have a url and filename property */
        if (v.url) {
          return '<a href="' + escHtml(v.url) + '" target="_blank" rel="noopener noreferrer" class="field-link">' +
            escHtml(v.filename || v.url) + '</a>';
        }
        return '<span class="field-obj">' + escHtml(JSON.stringify(v)) + '</span>';
      }
      return escHtml(String(v));
    }).join('<span class="field-sep">, </span>');
  }

  if (typeof value === 'object') {
    if (value.url) {
      return '<a href="' + escHtml(value.url) + '" target="_blank" rel="noopener noreferrer" class="field-link">' +
        escHtml(value.filename || value.url) + '</a>';
    }
    return '<span class="field-obj">' + escHtml(JSON.stringify(value)) + '</span>';
  }

  const str = String(value);

  /* Render URL-like strings as clickable links with truncation */
  if (/^https?:\/\//.test(str)) {
    const display = str.length > 64 ? str.slice(0, 61) + '\u2026' : str;
    return '<a href="' + escHtml(str) + '" target="_blank" rel="noopener noreferrer" class="field-link">' +
      escHtml(display) + '</a>';
  }

  return escHtml(str);
}

/* ── Field priority ordering ────────────────────────────────────────────── */
/*
 * Fields are sorted by relevance before rendering: any field whose name
 * contains a priority keyword floats to the top. Remaining fields appear
 * in the expand section. Priority order matches the keyword index.
 */
const PRIORITY_KEYWORDS = [
  'species', 'taxon', 'name', 'common',
  'observation', 'id',
  'timestamp', 'time', 'date',
  'location', 'coordinate', 'lat', 'lon',
  'iucn', 'conservation', 'status',
  'confidence', 'rarity',
  'ecological', 'role', 'habitat', 'depth', 'count',
];

function fieldPriority(key) {
  const lower = key.toLowerCase();
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    if (lower.indexOf(PRIORITY_KEYWORDS[i]) !== -1) return i;
  }
  return PRIORITY_KEYWORDS.length;
}

function sortedFields(fields) {
  return Object.entries(fields).sort(function (a, b) {
    return fieldPriority(a[0]) - fieldPriority(b[0]);
  });
}

/* ── Species Observations ───────────────────────────────────────────────── */

/* Number of fields shown by default before the expand toggle */
const SPECIES_PREVIEW_COUNT = 8;

function fieldRowHtml(key, value) {
  return '<div class="obs-field">' +
    '<span class="obs-field-label">' + escHtml(key) + '</span>' +
    '<span class="obs-field-value">' + renderFieldValue(value) + '</span>' +
    '</div>';
}

function buildSpeciesCard(record) {
  const fields  = record.fields || {};
  const sorted  = sortedFields(fields);
  const total   = sorted.length;
  const preview = sorted.slice(0, SPECIES_PREVIEW_COUNT);
  const rest    = sorted.slice(SPECIES_PREVIEW_COUNT);

  /* Identify the most suitable species name for the card header */
  const nameEntry = sorted.find(function (pair) {
    const kl = pair[0].toLowerCase();
    return kl.indexOf('species') !== -1 || kl === 'name' || kl.indexOf('taxon') !== -1;
  });
  const rawName    = nameEntry ? nameEntry[1] : null;
  const speciesName = (rawName !== null && rawName !== undefined && String(rawName))
    ? String(rawName)
    : 'Unknown Species';

  let previewHtml = '';
  for (let i = 0; i < preview.length; i++) {
    previewHtml += fieldRowHtml(preview[i][0], preview[i][1]);
  }

  let restHtml = '';
  for (let i = 0; i < rest.length; i++) {
    restHtml += fieldRowHtml(rest[i][0], rest[i][1]);
  }

  const expandBlock = rest.length > 0
    ? '<div class="obs-expand-wrap">' +
        '<button class="obs-expand-toggle" aria-expanded="false">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
            '<path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
          '<span class="obs-expand-label">Show all ' + total + ' fields</span>' +
        '</button>' +
        '<div class="obs-expand-section" hidden>' +
          '<div class="obs-field-grid">' + restHtml + '</div>' +
        '</div>' +
      '</div>'
    : '';

  const card = document.createElement('article');
  card.className = 'obs-card';
  card.innerHTML =
    '<div class="obs-card-header">' +
      '<span class="obs-record-id">' + escHtml(record.id) + '</span>' +
      '<h3 class="obs-species-name">' + escHtml(speciesName) + '</h3>' +
    '</div>' +
    '<div class="obs-field-grid">' + previewHtml + '</div>' +
    expandBlock;

  /* Bind expand toggle */
  const toggle = card.querySelector('.obs-expand-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      const section  = card.querySelector('.obs-expand-section');
      const label    = toggle.querySelector('.obs-expand-label');
      toggle.setAttribute('aria-expanded', String(!expanded));
      section.hidden = expanded;
      toggle.classList.toggle('obs-expand-toggle--open', !expanded);
      label.textContent = expanded
        ? 'Show all ' + total + ' fields'
        : 'Show fewer fields';
    });
  }

  return card;
}

async function loadSpecies(append) {
  const creds = getCredentials();

  if (!creds.tableSpecies) {
    showEmpty(elSpeciesGrid, 'Species Observations \u2014 no Table ID configured');
    elLoadMore.hidden = true;
    return;
  }

  if (!append) {
    showSkeleton(elSpeciesGrid, 4);
    elLoadMore.hidden = true;
    speciesOffset = null;
  } else {
    elBtnLoadMore.textContent = 'Loading\u2026';
    elBtnLoadMore.disabled    = true;
  }

  try {
    const data    = await fetchAirtablePage(creds.tableSpecies, append ? speciesOffset : null);
    const records = data.records || [];

    if (!append) elSpeciesGrid.innerHTML = '';

    if (records.length === 0 && !append) {
      showEmpty(elSpeciesGrid, 'Species Observations');
      elLoadMore.hidden = true;
      return;
    }

    for (let i = 0; i < records.length; i++) {
      elSpeciesGrid.appendChild(buildSpeciesCard(records[i]));
    }

    speciesOffset = data.offset || null;

    if (speciesOffset) {
      elLoadMore.hidden         = false;
      elBtnLoadMore.textContent = 'Load more records';
      elBtnLoadMore.disabled    = false;
    } else {
      elLoadMore.hidden = true;
    }
  } catch (err) {
    if (!append) {
      showError(elSpeciesGrid, err.message);
      elLoadMore.hidden = true;
    } else {
      /* On load-more failure, re-enable the button so the user can retry */
      elBtnLoadMore.textContent = 'Retry';
      elBtnLoadMore.disabled    = false;
    }
  }
}

elBtnLoadMore.addEventListener('click', function () {
  if (speciesOffset) loadSpecies(true);
});

/* ── Environmental Mapping ──────────────────────────────────────────────── */

/*
 * Renders a satellite image block for one zoom level.
 * url: the stored Mapbox URL from Airtable (or null).
 * label: display label for this zoom level.
 * altContext: species name used in alt text.
 */
function imgBlock(url, label, altContext) {
  if (!url) {
    return '<div class="map-img-block">' +
      '<span class="map-img-label">' + escHtml(label) + '</span>' +
      '<div class="map-img-placeholder">' +
        '<span class="map-img-na">No image stored</span>' +
      '</div>' +
    '</div>';
  }
  return '<div class="map-img-block">' +
    '<span class="map-img-label">' + escHtml(label) + '</span>' +
    '<a href="' + escHtml(String(url)) + '" target="_blank" rel="noopener noreferrer">' +
      '<img' +
        ' src="' + escHtml(String(url)) + '"' +
        ' alt="Satellite imagery ' + escHtml(label) + ' \u2014 ' + escHtml(altContext) + '"' +
        ' loading="lazy"' +
        ' class="map-img"' +
      '>' +
    '</a>' +
  '</div>';
}

function boolBadge(val) {
  const truthy = val === true || val === 'Yes' || val === 'true' || val === 1;
  return truthy
    ? '<span class="field-bool field-bool--true">Yes</span>'
    : '<span class="field-bool field-bool--false">No</span>';
}

function buildMappingCard(record) {
  const f = record.fields || {};

  /* Known column names from the Environmental Mapping table */
  const speciesName = f['Species Name']            || '\u2014';
  const obsId       = f['Observation ID']           || record.id;
  const overviewUrl = f['Map Overview URL']         || null;
  const detailUrl   = f['Map Detail URL']           || null;
  const closeupUrl  = f['Map Closeup URL']          || null;
  const coords      = f['Center Coordinates']       || '\u2014';
  const genDate     = f['Map Generation Date']      || '\u2014';
  const projection  = f['Projection System']        || '\u2014';
  const bathymetry  = f['Bathymetry Available'];
  const stations    = f['Research Stations Marked'];

  const card = document.createElement('article');
  card.className = 'map-card';
  card.innerHTML =
    '<div class="map-card-header">' +
      '<span class="obs-record-id">' + escHtml(String(obsId)) + '</span>' +
      '<h3 class="obs-species-name">' + escHtml(String(speciesName)) + '</h3>' +
    '</div>' +
    '<div class="map-img-row">' +
      imgBlock(overviewUrl, '10\u00d7 overview', String(speciesName)) +
      imgBlock(detailUrl,   '13\u00d7 detail',   String(speciesName)) +
      imgBlock(closeupUrl,  '15\u00d7 closeup',  String(speciesName)) +
    '</div>' +
    '<div class="map-meta-grid">' +
      '<div class="obs-field">' +
        '<span class="obs-field-label">Center Coordinates</span>' +
        '<span class="obs-field-value field-num">' + escHtml(String(coords)) + '</span>' +
      '</div>' +
      '<div class="obs-field">' +
        '<span class="obs-field-label">Map Generation Date</span>' +
        '<span class="obs-field-value">' + escHtml(String(genDate)) + '</span>' +
      '</div>' +
      '<div class="obs-field">' +
        '<span class="obs-field-label">Projection System</span>' +
        '<span class="obs-field-value field-num">' + escHtml(String(projection)) + '</span>' +
      '</div>' +
      '<div class="obs-field">' +
        '<span class="obs-field-label">Bathymetry Available</span>' +
        '<span class="obs-field-value">' + boolBadge(bathymetry) + '</span>' +
      '</div>' +
      '<div class="obs-field">' +
        '<span class="obs-field-label">Research Stations Marked</span>' +
        '<span class="obs-field-value">' + boolBadge(stations) + '</span>' +
      '</div>' +
    '</div>';

  return card;
}

async function loadMapping() {
  const creds = getCredentials();

  if (!creds.tableMapping) {
    showEmpty(elMappingGrid, 'Environmental Mapping \u2014 no Table ID configured');
    return;
  }

  showSkeleton(elMappingGrid, 3);

  try {
    const result = await fetchAllRecords(creds.tableMapping, 10);
    elMappingGrid.innerHTML = '';

    if (result.records.length === 0) {
      showEmpty(elMappingGrid, 'Environmental Mapping');
      return;
    }

    for (let i = 0; i < result.records.length; i++) {
      elMappingGrid.appendChild(buildMappingCard(result.records[i]));
    }

    if (result.truncated) {
      const note = document.createElement('p');
      note.className = 'dash-truncation-note';
      note.textContent =
        'Showing first 1,000 records. Export from Airtable to view the full dataset.';
      elMappingGrid.appendChild(note);
    }
  } catch (err) {
    showError(elMappingGrid, err.message);
  }
}

/* ── Daily Reports ──────────────────────────────────────────────────────── */

/*
 * Heuristically identifies a PDF URL, report title, and date from any
 * 3-column Airtable record. Does not assume specific field names.
 */
function buildReportRow(record) {
  const f      = record.fields || {};
  const sorted = Object.entries(f);

  let pdfUrl   = null;
  let titleVal = null;
  let dateVal  = null;

  sorted.forEach(function (pair) {
    const k   = pair[0];
    const v   = pair[1];
    const kl  = k.toLowerCase();
    const val = v ? String(v) : '';

    if (!pdfUrl && /^https?:\/\//.test(val) &&
        (kl.indexOf('url') !== -1 || kl.indexOf('pdf') !== -1 ||
         kl.indexOf('link') !== -1 || kl.indexOf('file') !== -1)) {
      pdfUrl = val;
    }
    if (!dateVal &&
        (kl.indexOf('date') !== -1 || kl.indexOf('time') !== -1 ||
         kl.indexOf('created') !== -1 || kl.indexOf('generated') !== -1)) {
      dateVal = { label: k, value: val };
    }
    if (!titleVal &&
        (kl.indexOf('name') !== -1 || kl.indexOf('title') !== -1 ||
         kl.indexOf('report') !== -1 || kl.indexOf('label') !== -1)) {
      titleVal = { label: k, value: val };
    }
  });

  /* Fallbacks: first field as title, first URL-valued field as link */
  if (!titleVal && sorted.length > 0) {
    titleVal = { label: sorted[0][0], value: String(sorted[0][1] || '') };
  }
  if (!pdfUrl) {
    sorted.forEach(function (pair) {
      const val = pair[1] ? String(pair[1]) : '';
      if (!pdfUrl && /^https?:\/\//.test(val)) pdfUrl = val;
    });
  }

  const displayTitle = titleVal ? (titleVal.value || titleVal.label) : record.id;
  const displayDate  = dateVal  ? dateVal.value : null;

  const downloadBtn = pdfUrl
    ? '<a href="' + escHtml(pdfUrl) + '"' +
        ' class="btn btn-secondary report-download"' +
        ' target="_blank"' +
        ' rel="noopener noreferrer">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
          '<path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
        'Download PDF' +
      '</a>'
    : '<span class="report-no-url">No PDF URL found</span>';

  const row = document.createElement('div');
  row.className = 'report-row';
  row.innerHTML =
    '<div class="report-row-info">' +
      '<span class="report-title">' + escHtml(displayTitle) + '</span>' +
      (displayDate ? '<span class="report-date">' + escHtml(displayDate) + '</span>' : '') +
    '</div>' +
    downloadBtn;

  return row;
}

async function loadReports() {
  const creds = getCredentials();

  if (!creds.tableReports) {
    showEmpty(elReportsList, 'Daily Reports \u2014 no Table ID configured');
    return;
  }

  elReportsList.innerHTML =
    '<div class="dash-skeleton" aria-hidden="true">' +
      '<div class="dash-skeleton-line"></div>' +
      '<div class="dash-skeleton-line dash-skeleton-line--short"></div>' +
    '</div>';

  try {
    const result = await fetchAllRecords(creds.tableReports, 10);
    elReportsList.innerHTML = '';

    if (result.records.length === 0) {
      showEmpty(elReportsList, 'Daily Reports');
      return;
    }

    for (let i = 0; i < result.records.length; i++) {
      elReportsList.appendChild(buildReportRow(result.records[i]));
    }

    if (result.truncated) {
      const note = document.createElement('p');
      note.className = 'dash-truncation-note';
      note.textContent =
        'Showing first 1,000 records. Export from Airtable to view the full dataset.';
      elReportsList.appendChild(note);
    }
  } catch (err) {
    showError(elReportsList, err.message);
  }
}

/* ── Tab switching ──────────────────────────────────────────────────────── */
dashTabs.forEach(function (tab) {
  tab.addEventListener('click', function () {
    const target = tab.dataset.tab;

    /* Update tab button states */
    dashTabs.forEach(function (t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    /* Show the target panel, hide the others */
    Object.keys(PANELS).forEach(function (key) {
      PANELS[key].hidden = key !== target;
    });

    /* Lazy-load data on first visit to each tab */
    if (target === 'mapping' && !tabsLoaded.mapping) {
      tabsLoaded.mapping = true;
      loadMapping();
    } else if (target === 'reports' && !tabsLoaded.reports) {
      tabsLoaded.reports = true;
      loadReports();
    }
  });
});

/* ── Dashboard initialisation ───────────────────────────────────────────── */

function resetTabs() {
  tabsLoaded.species = false;
  tabsLoaded.mapping = false;
  tabsLoaded.reports = false;

  dashTabs.forEach(function (t, i) {
    t.classList.toggle('active', i === 0);
    t.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  });

  PANELS.species.hidden = false;
  PANELS.mapping.hidden = true;
  PANELS.reports.hidden = true;
}

async function initDashboard() {
  if (!hasCredentials()) {
    showNoCreds();
    return;
  }

  showContent();
  resetTabs();

  tabsLoaded.species = true;
  await loadSpecies(false);
}

/* ── Boot ───────────────────────────────────────────────────────────────── */
populateSettingsFields();
initDashboard();
