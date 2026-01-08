const api = (path, opts = {}) => fetch('/api' + path, opts).then(async r => {
  try { return await r.json(); } catch(e) { return {}; }
});

const lotEl = document.getElementById('lot');
const parkedList = document.getElementById('parkedList');
const carInput = document.getElementById('carNo');
const searchInput = document.getElementById('searchCar');
const autoRefreshCheckbox = document.getElementById('autoRefresh');
const refreshIntervalSelect = document.getElementById('refreshInterval');

let autoTimer = null;

function setAutoRefresh(enabled) {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  if (enabled) {
    const ms = parseInt(refreshIntervalSelect.value, 10) || 5000;
    autoTimer = setInterval(() => refresh(), ms);
  }
}

async function renderSlots() {
  const data = await api('/slots');
  if (!data || !data.slots) return;
  lotEl.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'lot-grid';
  const search = (searchInput.value || '').trim().toUpperCase();
  let occupied = 0;
  data.slots.forEach(s => {
    const el = document.createElement('div');
    el.className = 'slot ' + (s.car_no ? 'occupied' : 'free');
    el.dataset.slot = s.slot;
    el.dataset.car = s.car_no || '';
    el.innerHTML = `<div class="label">${s.slot}</div>` + (s.car_no ? `<div style="font-size:11px">${s.car_no}</div>` : '');
    if (s.car_no) occupied++;
    // highlight search matches
    if (search && s.car_no && s.car_no.toUpperCase().includes(search)) {
      el.classList.add('highlight');
    }
    el.addEventListener('click', () => {
      // clicking a slot prefills car input with its parked car (or slot number for free)
      const car = el.dataset.car;
      if (car) carInput.value = car;
      else carInput.value = '';
      carInput.focus();
    });
    grid.appendChild(el);
  });
  lotEl.appendChild(grid);
  renderStats(data.slots.length, occupied);
}

function renderStats(total, occupied) {
  let s = document.querySelector('.stats');
  if (!s) {
    s = document.createElement('div');
    s.className = 'stats';
    document.querySelector('.lot').appendChild(s);
  }
  s.textContent = `Slots: ${total} · Occupied: ${occupied} · Free: ${total - occupied}`;
}

async function renderList() {
  const data = await api('/list');
  parkedList.innerHTML = '';
  if (!Array.isArray(data)) return;
  data.forEach(item => {
    const li = document.createElement('li');
  li.dataset.car = item.car_no;
  li.dataset.entryMs = item.entry_time;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'runtime';
    // initial runtime
    timeSpan.textContent = formatRuntime(Date.now() - item.entry_time);
    const t = new Date(item.entry_time).toLocaleTimeString();
    li.innerHTML = `<strong>${item.car_no}</strong> — slot ${item.slot} — entered ${t} `;
    li.appendChild(timeSpan);
    const ticketBtn = document.createElement('button');
  ticketBtn.textContent = 'Get Ticket';
  ticketBtn.style.marginLeft = '8px';
  ticketBtn.style.padding = '4px 8px';
    ticketBtn.addEventListener('click', async () => {
      const res = await api(`/ticket?car_no=${encodeURIComponent(item.car_no)}`);
      if (res.error) return alert(res.error);
      alert(`Car ${res.car_no}\nSlot ${res.slot}\nHours: ${res.ticket.hours}\nCost: Rs ${res.ticket.cost}`);
    });
    li.appendChild(ticketBtn);
    parkedList.appendChild(li);
  });
}

// update runtimes every second
setInterval(() => {
  document.querySelectorAll('#parkedList li').forEach(li => {
    const car = li.dataset.car;
    if (!car) return;
    // fetch entry time from list rendering (runtime span contains ms?) — instead compute by calling /list less frequently
    // We'll store entry_time on the li when rendering instead
    const span = li.querySelector('.runtime');
    if (li.dataset.entryMs) {
      const entryMs = parseInt(li.dataset.entryMs, 10);
      span.textContent = formatRuntime(Date.now() - entryMs);
    }
  });
}, 1000);

function formatRuntime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `(${h}h ${m}m ${s}s)`;
  if (m > 0) return `(${m}m ${s}s)`;
  return `(${s}s)`;
}

async function park() {
  const car_no = carInput.value.trim();
  if (!car_no) return alert('enter car number');
  const res = await api('/park', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({car_no})});
  if (res.error) alert(res.error);
  else { carInput.value=''; await refresh(); }
}

async function leave() {
  const car_no = carInput.value.trim();
  if (!car_no) return alert('enter car number');
  const res = await api('/leave', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({car_no})});
  if (res.error) alert(res.error);
  else { carInput.value=''; await refresh(); }
}

async function refresh() { await Promise.all([renderSlots(), renderList()]); }

document.getElementById('parkBtn').addEventListener('click', park);
document.getElementById('leaveBtn').addEventListener('click', leave);
document.getElementById('refreshBtn').addEventListener('click', refresh);
searchInput.addEventListener('input', () => renderSlots());
autoRefreshCheckbox.addEventListener('change', (e) => setAutoRefresh(e.target.checked));
refreshIntervalSelect.addEventListener('change', () => { if (autoRefreshCheckbox.checked) setAutoRefresh(true); });

// initial
refresh();
