/* ============================================================
   AUDTHEIA — RESEARCHER DASHBOARD
   website/assets/dashboard.js
   Session 5 — rev 2 (species card redesign)
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
  elPat.value = elBaseId.value = elTableSpecies.value =
  elTableMapping.value = elTableReports.value = '';
  showMsg('Credentials cleared from local storage.', 'success');
  showNoCreds();
});

/* ── Airtable fetch ─────────────────────────────────────────────────────── */
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
      if (body && body.error && body.error.message) message = body.error.message;
    } catch (_) { /* ignore */ }
    throw new Error(message);
  }

  return res.json();
}

async function fetchAllRecords(tableId, maxPages) {
  maxPages = maxPages || 10;
  const records = [];
  let offset    = null;
  let page      = 0;
  let truncated = false;

  do {
    const data  = await fetchAirtablePage(tableId, offset);
    const batch = data.records || [];
    for (let i = 0; i < batch.length; i++) records.push(batch[i]);
    offset = data.offset || null;
    page++;
    if (page >= maxPages && offset) { truncated = true; break; }
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
        ' \u2014 Check your credentials and table IDs in Settings.' +
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
  if (/^https?:\/\//.test(str)) {
    const display = str.length > 64 ? str.slice(0, 61) + '\u2026' : str;
    return '<a href="' + escHtml(str) + '" target="_blank" rel="noopener noreferrer" class="field-link">' +
      escHtml(display) + '</a>';
  }
  return escHtml(str);
}

/* ── Field priority ordering ────────────────────────────────────────────── */
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

/*
 * Stat chips: each entry defines one header chip shown on every card.
 * keywords: ALL must appear in the field name (case-insensitive) to match.
 * label:    short display label for the chip header.
 * type:     'num' renders the value in teal monospace; 'txt' uses body text.
 */
const STAT_DEFS = [
  { keywords: ['rarity', 'score'], label: 'Rarity',    type: 'num' },
  { keywords: ['abundance'],       label: 'Abundance', type: 'txt' },
  { keywords: ['invasive'],        label: 'Invasive',  type: 'txt' },
  { keywords: ['count'],           label: 'Count',     type: 'num' },
];

/* Returns the STAT_DEFS index that matches fieldKey, or -1 if none match. */
function matchStatDef(fieldKey) {
  const lower = fieldKey.toLowerCase();
  for (let i = 0; i < STAT_DEFS.length; i++) {
    const kws = STAT_DEFS[i].keywords;
    let allMatch = true;
    for (let j = 0; j < kws.length; j++) {
      if (lower.indexOf(kws[j]) === -1) { allMatch = false; break; }
    }
    if (allMatch) return i;
  }
  return -1;
}

/* Formats an ISO 8601 datetime string into a readable short form. */
function formatObsTime(val) {
  if (!val) return null;
  try {
    const d = new Date(String(val));
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString('en-US', {
      year:   'numeric',
      month:  'short',
      day:    'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return String(val);
  }
}

function buildSpeciesCard(record) {
  const fields = record.fields || {};
  const sorted = sortedFields(fields);
  const total  = sorted.length;

  /* ── Named field extraction ─────────────────────────────────────────── */

  /* Species name: prefer field containing both 'species' and 'name' */
  let nameEntry = null;
  for (let n = 0; n < sorted.length; n++) {
    const kl = sorted[n][0].toLowerCase();
    if (kl.indexOf('species') !== -1 && kl.indexOf('name') !== -1) {
      nameEntry = sorted[n]; break;
    }
  }
  if (!nameEntry) {
    for (let n2 = 0; n2 < sorted.length; n2++) {
      if (sorted[n2][0].toLowerCase() === 'name') { nameEntry = sorted[n2]; break; }
    }
  }
  const speciesName = (nameEntry && nameEntry[1]) ? String(nameEntry[1]) : 'Unknown Species';

  /* Observation time: first field containing 'time' or 'timestamp' */
  let timeEntry = null;
  for (let t = 0; t < sorted.length; t++) {
    const tkl = sorted[t][0].toLowerCase();
    if (tkl.indexOf('time') !== -1 || tkl.indexOf('timestamp') !== -1) {
      timeEntry = sorted[t]; break;
    }
  }
  const obsTime = timeEntry ? formatObsTime(timeEntry[1]) : null;

  /* Stat chips: scan all fields and fill up to 4 STAT_DEFS slots */
  const statSlots = [null, null, null, null];
  for (let s = 0; s < sorted.length; s++) {
    const idx = matchStatDef(sorted[s][0]);
    if (idx >= 0 && !statSlots[idx]) {
      statSlots[idx] = { key: sorted[s][0], value: sorted[s][1] };
    }
  }

  /* Build a lookup of keys already shown so they are skipped in expand */
  const usedKeys = {};
  if (nameEntry) usedKeys[nameEntry[0]] = true;
  if (timeEntry) usedKeys[timeEntry[0]] = true;
  for (let u = 0; u < statSlots.length; u++) {
    if (statSlots[u]) usedKeys[statSlots[u].key] = true;
  }

  /* Remaining fields go into the collapsible expand list */
  const restFields = sorted.filter(function (p) { return !usedKeys[p[0]]; });

  /* ── HTML assembly ──────────────────────────────────────────────────── */

  function statChipHtml(def, slot) {
    let valStr, valClass;
    const raw = slot ? slot.value : null;
    if (raw === null || raw === undefined || raw === '') {
      valStr   = '\u2014';
      valClass = 'obs-stat-value obs-stat-null';
    } else if (def.type === 'num') {
      valStr   = escHtml(String(raw));
      valClass = 'obs-stat-value obs-stat-num';
    } else {
      valStr   = escHtml(String(raw));
      valClass = 'obs-stat-value';
    }
    return '<div class="obs-stat">' +
      '<span class="obs-stat-label">' + escHtml(def.label) + '</span>' +
      '<span class="' + valClass + '">' + valStr + '</span>' +
    '</div>';
  }

  let statsHtml = '';
  for (let d = 0; d < STAT_DEFS.length; d++) {
    statsHtml += statChipHtml(STAT_DEFS[d], statSlots[d]);
  }

  /* Expand section: single-column definition list, much more readable for
     long-text fields like rarity reasoning and full taxonomy strings. */
  let expandItemsHtml = '';
  for (let r = 0; r < restFields.length; r++) {
    expandItemsHtml +=
      '<div class="obs-expand-item">' +
        '<dt class="obs-expand-key">' + escHtml(restFields[r][0]) + '</dt>' +
        '<dd class="obs-expand-val">' + renderFieldValue(restFields[r][1]) + '</dd>' +
      '</div>';
  }

  const expandBlock = restFields.length > 0
    ? '<div class="obs-expand-wrap">' +
        '<button class="obs-expand-toggle" aria-expanded="false">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
            '<path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5"' +
              ' stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
          '<span class="obs-expand-label">Show all ' + total + ' fields</span>' +
        '</button>' +
        '<div class="obs-expand-section" hidden>' +
          '<dl class="obs-expand-list">' + expandItemsHtml + '</dl>' +
        '</div>' +
      '</div>'
    : '';

  const card = document.createElement('article');
  card.className = 'obs-card';
  card.innerHTML =
    '<div class="obs-card-header">' +
      '<div class="obs-card-meta">' +
        '<span class="obs-record-id">' + escHtml(record.id) + '</span>' +
        (obsTime ? '<span class="obs-time">' + escHtml(obsTime) + '</span>' : '') +
      '</div>' +
      '<h3 class="obs-species-name">' + escHtml(speciesName) + '</h3>' +
    '</div>' +
    '<div class="obs-stats-row">' + statsHtml + '</div>' +
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
      elBtnLoadMore.textContent = 'Retry';
      elBtnLoadMore.disabled    = false;
    }
  }
}

elBtnLoadMore.addEventListener('click', function () {
  if (speciesOffset) loadSpecies(true);
});

/* ── Environmental Mapping ──────────────────────────────────────────────── */
function imgBlock(url, label, altContext) {
  if (!url) {
    return '<div class="map-img-block">' +
      '<span class="map-img-label">' + escHtml(label) + '</span>' +
      '<div class="map-img-placeholder"><span class="map-img-na">No image stored</span></div>' +
    '</div>';
  }
  return '<div class="map-img-block">' +
    '<span class="map-img-label">' + escHtml(label) + '</span>' +
    '<a href="' + escHtml(String(url)) + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + escHtml(String(url)) + '"' +
        ' alt="Satellite imagery ' + escHtml(label) + ' \u2014 ' + escHtml(altContext) + '"' +
        ' loading="lazy" class="map-img">' +
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

  const speciesName = f['Species Name']          || '\u2014';
  const obsId       = f['Observation ID']         || record.id;
  const overviewUrl = f['Map Overview URL']        || null;
  const detailUrl   = f['Map Detail URL']          || null;
  const closeupUrl  = f['Map Closeup URL']         || null;
  const coords      = f['Center Coordinates']      || '\u2014';
  const genDate     = f['Map Generation Date']     || '\u2014';
  const projection  = f['Projection System']       || '\u2014';
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
      '<div class="obs-field"><span class="obs-field-label">Center Coordinates</span>' +
        '<span class="obs-field-value field-num">' + escHtml(String(coords)) + '</span></div>' +
      '<div class="obs-field"><span class="obs-field-label">Map Generation Date</span>' +
        '<span class="obs-field-value">' + escHtml(String(genDate)) + '</span></div>' +
      '<div class="obs-field"><span class="obs-field-label">Projection System</span>' +
        '<span class="obs-field-value field-num">' + escHtml(String(projection)) + '</span></div>' +
      '<div class="obs-field"><span class="obs-field-label">Bathymetry Available</span>' +
        '<span class="obs-field-value">' + boolBadge(bathymetry) + '</span></div>' +
      '<div class="obs-field"><span class="obs-field-label">Research Stations Marked</span>' +
        '<span class="obs-field-value">' + boolBadge(stations) + '</span></div>' +
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
      note.className   = 'dash-truncation-note';
      note.textContent = 'Showing first 1,000 records. Export from Airtable to view the full dataset.';
      elMappingGrid.appendChild(note);
    }
  } catch (err) {
    showError(elMappingGrid, err.message);
  }
}

/* ── Daily Reports ──────────────────────────────────────────────────────── */
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
    if (!dateVal && (kl.indexOf('date') !== -1 || kl.indexOf('time') !== -1 ||
        kl.indexOf('created') !== -1 || kl.indexOf('generated') !== -1)) {
      dateVal = { label: k, value: val };
    }
    if (!titleVal && (kl.indexOf('name') !== -1 || kl.indexOf('title') !== -1 ||
        kl.indexOf('report') !== -1 || kl.indexOf('label') !== -1)) {
      titleVal = { label: k, value: val };
    }
  });

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
    ? '<a href="' + escHtml(pdfUrl) + '" class="btn btn-secondary report-download"' +
        ' target="_blank" rel="noopener noreferrer">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
          '<path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor"' +
            ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>Download PDF</a>'
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
      note.className   = 'dash-truncation-note';
      note.textContent = 'Showing first 1,000 records. Export from Airtable to view the full dataset.';
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

    dashTabs.forEach(function (t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    Object.keys(PANELS).forEach(function (key) {
      PANELS[key].hidden = key !== target;
    });

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
