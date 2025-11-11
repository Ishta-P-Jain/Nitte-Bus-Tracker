// ---------------- Bus Data loader ----------------
// We'll attempt to load `buses.json` (recommended). If fetch fails (file:// or missing file), fall back to an embedded dataset.
/* Consolidated script.js
   - Loads buses.json (falls back to embedded array if fetch fails)
   - Renders route list and bus cards
   - Provides search, clear, filter-by-bus, modal, sidebar, and mode toggle
*/

let buses = [];

const embeddedBuses = [
  {
    id: 1,
    name: "Bus 1",
    from: "Mangalore",
    to: "Nitte",
    time: "1 hr 30 min",
    depart: "7:00 AM",
    arrive: "8:30 AM",
    stops: [
      { no: 1, name: "Mangalore Bus Stand", arrival: "7:00", departure: "7:05" },
      { no: 2, name: "Surathkal", arrival: "7:30", departure: "7:32" },
      { no: 3, name: "Nitte Campus", arrival: "8:30", departure: "8:30" }
    ]
  },
  {
    id: 2,
    name: "Bus 2",
    from: "Udupi",
    to: "Nitte",
    time: "1 hr 30 min",
    depart: "6:45 AM",
    arrive: "8:15 AM",
    stops: [
      { no: 1, name: "Udupi Bus Stand", arrival: "6:45", departure: "6:50" },
      { no: 2, name: "Kundapura", arrival: "7:30", departure: "7:32" },
      { no: 3, name: "Nitte Campus", arrival: "8:15", departure: "8:15" }
    ]
  },
  {
    id: 3,
    name: "Bus 3",
    from: "Moodbidri",
    to: "Nitte",
    time: "1 hr 30 min",
    depart: "7:15 AM",
    arrive: "8:45 AM",
    stops: [
      { no: 1, name: "Moodbidri", arrival: "7:15", departure: "7:20" },
      { no: 2, name: "Karkala", arrival: "7:50", departure: "7:52" },
      { no: 3, name: "Nitte Campus", arrival: "8:45", departure: "8:45" }
    ]
  },
  {
    id: 4,
    name: "Bus 4",
    from: "Belthangadi",
    to: "Nitte",
    time: "1 hr 30 min",
    depart: "6:30 AM",
    arrive: "8:00 AM",
    stops: [
      { no: 1, name: "Belthangadi Bus Stand", arrival: "6:30", departure: "6:35" },
      { no: 2, name: "Sullia", arrival: "7:10", departure: "7:12" },
      { no: 3, name: "Nitte Campus", arrival: "8:00", departure: "8:00" }
    ]
  }
];

// Safe DOM element getters
const getEl = (id) => document.getElementById(id);

const rvSearchEl = getEl('rvSearch');
const rvClearEl = getEl('rvClear');
const rvControlsEl = getEl('rvControls');
const routeListEl = getEl('routeList');
const busCardsContainer = getEl('busCards');
const modal = getEl('modal');
const busTitle = getEl('busTitle');
const busInfo = getEl('busInfo');
const busStats = getEl('busStats');
const timetable = getEl('timetable');
const sidebar = getEl('sidebar');
const hamburger = getEl('hamburger');
const timetableView = getEl('timetableView');
const timetableContainer = getEl('timetableContainer');
const closeTimetableBtn = getEl('closeTimetable');

function loadBusesJson() {
  return fetch('buses.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch buses.json');
      return res.json();
    })
    .then(json => json.buses || json)
    .catch(err => {
      console.warn('Could not load buses.json, falling back to embedded data:', err.message);
      return embeddedBuses;
    });
}

// Render functions
function renderRouteList(busList = buses) {
  if (!routeListEl) return;
  routeListEl.innerHTML = '';
  busList.forEach(bus => {
    const rc = document.createElement('div');
    rc.className = 'route-card';
    rc.innerHTML = `
      <h4>${escapeHtml(bus.name)} <small style="color:#666; font-weight:normal">${escapeHtml(bus.from)} → ${escapeHtml(bus.to)}</small></h4>
      <div class="stops" data-bus-id="${bus.id}">
        ${bus.stops.map(s => `<div class="stop" data-bus-id="${bus.id}" data-stop-no="${s.no}" title="${escapeHtml(s.arrival)} / ${escapeHtml(s.departure)}">${escapeHtml(s.name)}</div>`).join('')}
      </div>
      <div style="margin-top:8px; font-size:13px; color:#444">Departs: ${escapeHtml(bus.depart)} · Arrives: ${escapeHtml(bus.arrive)}</div>
    `;
    routeListEl.appendChild(rc);
  });

  // attach click handlers for stops
  routeListEl.querySelectorAll('.stop').forEach(el => {
    el.addEventListener('click', (e) => {
      const busId = parseInt(el.getAttribute('data-bus-id'));
      const stopNo = parseInt(el.getAttribute('data-stop-no'));
      onStopSelected(busId, stopNo);
    });
  });
}

function renderBusCards(busList = buses) {
  if (!busCardsContainer) return;
  busCardsContainer.innerHTML = '';
  busList.forEach(bus => {
    const card = document.createElement('div');
    card.className = 'bus-card';
    card.innerHTML = `
      <h3> ${escapeHtml(bus.name)}</h3>
      <p><b>From:</b> ${escapeHtml(bus.from)} → ${escapeHtml(bus.to)}</p>
      <p><b>Travel Time:</b> ${escapeHtml(bus.time)}</p>
      <p><b>Departure:</b> ${escapeHtml(bus.depart)}</p>
      <p><b>Arrival:</b> ${escapeHtml(bus.arrive)}</p>
      <button data-bus-id="${bus.id}">View Details →</button>
    `;
    busCardsContainer.appendChild(card);
  });

  // attach listeners to buttons. When opened from a "View Details" button we hide the rv search controls.
  busCardsContainer.querySelectorAll('button[data-bus-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.getAttribute('data-bus-id'));
      // hide rv controls when opening from this button
      openModal(id, { hideSearch: true });
    });
  });

  // keep route list in sync
  renderRouteList(busList);
}

// Escape helper for minimal safety when injecting text
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>"]/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]);
  });
}

let selected = { busId: null, stopNo: null };
function onStopSelected(busId, stopNo) {
  selected = { busId, stopNo };
  document.querySelectorAll('.stop').forEach(el => {
    const b = parseInt(el.getAttribute('data-bus-id'));
    const n = parseInt(el.getAttribute('data-stop-no'));
    el.classList.toggle('selected', b === busId && n === stopNo);
    el.classList.remove('nearest');
  });

  const bus = buses.find(b => b.id === busId);
  if (!bus) return;
  const idx = bus.stops.findIndex(s => s.no === stopNo);
  const candidates = [];
  if (idx > 0) candidates.push(bus.stops[idx - 1].no);
  if (idx < bus.stops.length - 1) candidates.push(bus.stops[idx + 1].no);
  const nearestNo = candidates.length ? candidates[0] : null;
  if (nearestNo !== null) {
    const nearestEl = document.querySelector(`.stop[data-bus-id='${busId}'][data-stop-no='${nearestNo}']`);
    if (nearestEl) nearestEl.classList.add('nearest');
  }

  openModal(busId);
  // highlight row in timetable after it's rendered
  setTimeout(() => {
    const rows = document.querySelectorAll('#timetable tr');
    rows.forEach(r => r.style.background = '');
    const selRow = Array.from(rows).find(r => r.querySelector('td') && r.querySelector('td').textContent == stopNo);
    if (selRow) selRow.style.background = 'rgba(252,163,17,0.12)';
  }, 60);
}

function openModal(id, options = {}) {
  const bus = buses.find(b => b.id === id) || buses[0];
  if (!modal) return;
  // optionally hide the RV controls (search + clear)
  if (options.hideSearch && rvControlsEl) {
    rvControlsEl.style.display = 'none';
  }
  modal.classList.add('active');
  if (busTitle) busTitle.textContent = ` ${bus.name}`;
  if (busInfo) busInfo.textContent = `Route: ${bus.from} → ${bus.to}`;
  if (busStats) busStats.textContent = `Total Stops: ${bus.stops.length} | Duration: ${bus.time} | First Trip: ${bus.depart}`;

  if (timetable) {
    timetable.innerHTML = `
      <tr><th>Stop No</th><th>Stop Name</th><th>Arrival</th><th>Departure</th></tr>
      ${bus.stops.map(stop => `
        <tr>
          <td>${stop.no}</td>
          <td>${escapeHtml(stop.name)}</td>
          <td>${escapeHtml(stop.arrival)}</td>
          <td>${escapeHtml(stop.departure)}</td>
        </tr>`).join('')}
    `;
  }
  // render the virtual map in the modal's .map-view
  renderMapInModal(bus);
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('active');
  // restore rv controls visibility when modal closed
  if (rvControlsEl) rvControlsEl.style.display = '';
  // stop any running map animation
  stopMapAnimation();
}

// Expose closeModal globally for inline onclick in HTML
window.closeModal = closeModal;

function filterBus(busName) {
  const filtered = buses.filter(b => b.name === busName);
  renderBusCards(filtered);
}

// wire search and clear
function initRvControls() {
  if (rvSearchEl) {
    rvSearchEl.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      if (!term) { renderBusCards(buses); return; }
      const filtered = buses.filter(bus => {
        if (bus.name && bus.name.toLowerCase().includes(term)) return true;
        return bus.stops && bus.stops.some(s => s.name.toLowerCase().includes(term));
      });
      renderBusCards(filtered);
    });
  }

  if (rvClearEl) {
    rvClearEl.addEventListener('click', () => {
      if (rvSearchEl) rvSearchEl.value = '';
      renderBusCards(buses);
    });
  }
}

// Sidebar / hamburger
function toggleSidebar() {
  if (!sidebar || !hamburger) return;
  const open = sidebar.classList.toggle('open');
  hamburger.classList.toggle('open', open);
}
window.toggleSidebar = toggleSidebar; // expose for inline onclick

// close sidebar when clicking outside
document.addEventListener('click', (e) => {
  if (!sidebar || !hamburger) return;
  if (!sidebar.classList.contains('open')) return;
  const target = e.target;
  if (sidebar.contains(target) || hamburger.contains(target)) return;
  sidebar.classList.remove('open');
  hamburger.classList.remove('open');
});

document.addEventListener('keydown', (e) => {
  if (!sidebar) return;
  if (e.key === 'Escape' && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (hamburger) hamburger.classList.remove('open');
  }
  // close modal on Escape as well
  if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
    closeModal();
  }
});

// Mode toggle
function toggleMode() {
  const btn = getEl('modeToggle');
  const isDark = document.body.classList.toggle('dark-mode');
  if (btn) {
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', isDark);
  }
}
window.toggleMode = toggleMode; // expose for inline onclick

// Start app
loadBusesJson().then(data => {
  buses = data;
  initRvControls();
  renderBusCards(buses);
  renderRouteList(buses);
});

// expose filterBus and openModal globally (used from HTML inline handlers)
window.filterBus = filterBus;
window.openModal = openModal;

// About modal handlers
const aboutModal = getEl('aboutModal');
const aboutInline = getEl('aboutInline');
function openAbout() {
  if (!aboutModal) return;
  aboutModal.classList.add('active');
  aboutModal.setAttribute('aria-hidden', 'false');
  // hide route viewer controls (search + clear) when About is opened
  if (rvControlsEl) rvControlsEl.style.display = 'none';
  
}

function closeAbout() {
  if (!aboutModal) return;
  aboutModal.classList.remove('active');
  aboutModal.setAttribute('aria-hidden', 'true');
  // restore rv-controls visibility
  if (rvControlsEl) rvControlsEl.style.display = '';
  if (aboutInline) {
    aboutInline.hidden = true;
    aboutInline.innerHTML = '';
  }
}
window.openAbout = openAbout;
window.closeAbout = closeAbout;

// Timetable view (sidebar)
function openTimetableView() {
  if (!timetableView || !timetableContainer) return;
  // build table
  const rows = buses.map(b => {
    const stopsText = (b.stops || []).map(s => s.name).join(' → ');
    return `
      <tr>
        <td>${escapeHtml(b.name)}</td>
        <td>${escapeHtml(b.from)} → ${escapeHtml(b.to)}</td>
        <td>${escapeHtml(b.depart)}</td>
        <td>${escapeHtml(b.arrive)}</td>
        <td>${escapeHtml(b.time)}</td>
        <td>${escapeHtml(stopsText)}</td>
      </tr>`;
  }).join('');

  timetableContainer.innerHTML = `
    <table class="full-timetable">
      <thead>
        <tr>
          <th>Bus</th>
          <th>From → To</th>
          <th>Depart</th>
          <th>Arrive</th>
          <th>Duration</th>
          <th>Stops</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;

  timetableView.hidden = false;
}

function closeTimetableView() {
  if (!timetableView) return;
  timetableView.hidden = true;
}

if (closeTimetableBtn) {
  closeTimetableBtn.addEventListener('click', () => closeTimetableView());
}

window.openTimetableView = openTimetableView;
window.closeTimetableView = closeTimetableView;

// --- Virtual Map and live-bus simulation ---
let mapAnimationFrame = null;
let mapBusState = { t: 0, dir: 1 };

function renderMapInModal(bus) {
  const mapView = document.querySelector('.map-view');
  if (!mapView) return;

  // clear previous content
  mapView.innerHTML = '';

  // Build a Google Maps embed URL that searches for "origin to destination".
  // This approach uses the public maps viewer (no API key). It centers the map on the query.
  const origin = bus.from || '';
  const destination = bus.to || '';
  const q = encodeURIComponent(`${origin} to ${destination}`);
  const src = `https://maps.google.com/maps?q=${q}&output=embed`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('src', src);
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  iframe.setAttribute('allowfullscreen', '');
  iframe.style.border = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';

  mapView.appendChild(iframe);
}

function samplePointOnPath(points, t) {
  // linear segment interpolation across points
  const totalSeg = points.length - 1;
  const segF = t * totalSeg;
  const segIndex = Math.min(totalSeg - 1, Math.floor(segF));
  const localT = segF - segIndex;
  const a = points[segIndex];
  const b = points[segIndex + 1];
  const x = a.x + (b.x - a.x) * localT;
  const y = a.y + (b.y - a.y) * localT;
  return { x, y };
}

function startMapAnimation(pathElem, busMarker, points) {
  // stop previous animation
  stopMapAnimation();
  mapBusState.t = 0;
  mapBusState.dir = 1;

  function step() {
    mapBusState.t += 0.002 * mapBusState.dir; // speed
    if (mapBusState.t >= 1) mapBusState.dir = -1;
    if (mapBusState.t <= 0) mapBusState.dir = 1;
    const p = samplePointOnPath(points, mapBusState.t);
    busMarker.setAttribute('cx', p.x);
    busMarker.setAttribute('cy', p.y);
    mapAnimationFrame = requestAnimationFrame(step);
  }
  mapAnimationFrame = requestAnimationFrame(step);
}

function stopMapAnimation() {
  if (mapAnimationFrame) {
    cancelAnimationFrame(mapAnimationFrame);
    mapAnimationFrame = null;
  }
}
