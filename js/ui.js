/**
 * Megjelenítés (DOM). Tiszta render-függvények, amelyeket az app.js hív.
 * A korábbi (Apps Script) felület kártya/badge/összesítő/űrlap logikájának
 * portja sima DOM-ra, kiegészítve táblázatnézettel.
 */

/* ----------------------- alap segédek ----------------------- */
export const $ = sel => document.querySelector(sel);
export const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};
export const esc = s => String(s == null ? '' : s)
  .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const parseNum = v => {
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};
export const formatFt = n => (n || 0).toLocaleString('hu-HU') + ' Ft';

/* dátum-segédek (napi naplóhoz) */
const HU_DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function formatDateHu(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return dateStr.slice(5) + ' ' + (HU_DAYS[d.getDay()] || '');
}
function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const offset = (now.getDay() + 6) % 7;             // hétfő = 0
  const monday = new Date(now); monday.setDate(now.getDate() - offset);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
  return d >= monday && d <= sunday;
}
function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return d < t;
}

export function showLoader(on) { $('#loader').classList.toggle('on', !!on); }
let toastTimer;
export function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 3000);
}

/* ----------------------- fülek ----------------------- */
export function renderTabs(categories, activeKey, onSelect) {
  const tabs = $('#tabs'); tabs.innerHTML = '';
  categories.forEach(cat => {
    const t = el('button', 'tab' + (cat.key === activeKey ? ' active' : ''),
      (cat.icon ? cat.icon + ' ' : '') + cat.label);
    t.onclick = () => onSelect(cat.key);
    tabs.appendChild(t);
  });
}

export function populateStatusFilter(category) {
  const sf = $('#statusFilter');
  sf.innerHTML = '<option value="">Minden állapot</option>';
  const f = category.fields.find(x => x.key === 'allapot');
  if (f) f.options.forEach(o => { const op = el('option', null, o); op.value = o; sf.appendChild(op); });
}

/* ----------------------- összesítő ----------------------- */
export function renderSummary(rows, category) {
  const hasPay = category && category.fields.some(f => f.key === 'fizetes_statusz');
  const naploField = category && category.fields.find(f => f.type === 'naplo');
  const total = rows.length;
  const open = rows.filter(r => !/lezár/i.test(r.allapot || '')).length;
  const s = $('#summary'); s.innerHTML = '';
  s.appendChild(stat(total, 'munka összesen'));
  s.appendChild(stat(open, 'nyitott'));
  if (hasPay) {
    const unpaid = rows.filter(r => r.fizetes_statusz && r.fizetes_statusz !== 'Kifizetve').length;
    const owed = rows.reduce((sum, r) => r.fizetes_statusz === 'Kifizetve'
      ? sum : sum + Math.max(parseNum(r.vallalt_dij) - parseNum(r.fizetett_osszeg), 0), 0);
    s.appendChild(stat(unpaid, 'rendezetlen fizetés'));
    s.appendChild(stat(formatFt(owed), 'kintlévőség'));
  } else {
    const overdue = rows.filter(r => isOverdue(r.hatarido) && !/lezár/i.test(r.allapot || '')).length;
    s.appendChild(stat(overdue, 'lejárt határidő'));
    if (naploField) {
      const wk = rows.filter(r => Array.isArray(r[naploField.key]) && r[naploField.key].some(e => isThisWeek(e.datum))).length;
      s.appendChild(stat(wk, 'naplózva ezen a héten'));
    }
  }
}
function stat(num, lbl) {
  const d = el('div', 'stat');
  d.appendChild(el('div', 'num', String(num)));
  d.appendChild(el('div', 'lbl', lbl));
  return d;
}

/* ----------------------- badge-ek ----------------------- */
function badge(txt, cls) { return el('span', 'badge ' + (cls || ''), txt); }
function statusBadge(v) {
  let cls = 'blue';
  if (/lezár|jóváhagy|kész/i.test(v)) cls = 'green';
  else if (/hiánypótl|felfügg/i.test(v)) cls = 'amber';
  return badge(v, cls);
}
function payBadge(v) {
  const cls = v === 'Kifizetve' ? 'green' : v === 'Részben fizetett' ? 'amber' : 'red';
  return badge('💰 ' + v, cls);
}
function prioBadge(v) {
  const cls = /sürg|magas/i.test(v) ? 'red' : /közepes/i.test(v) ? 'amber' : '';
  return badge(v, cls);
}
function dueBadge(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((d - today) / 86400000);
  let cls = '', prefix = '📅 ';
  if (diff < 0) { cls = 'due'; prefix = '⚠️ lejárt: '; }
  else if (diff <= 7) { cls = 'soon'; prefix = '⏳ '; }
  return badge(prefix + dateStr, cls);
}

/* ----------------------- kártyanézet ----------------------- */
export function renderCards(rows, category, onOpen) {
  const wrap = el('div', 'cards');
  rows.forEach(r => wrap.appendChild(renderCard(r, category, onOpen)));
  return wrap;
}
function renderCard(r, category, onOpen) {
  const card = el('div', 'card');
  card.onclick = () => onOpen(r);

  const head = el('div', 'card-head');
  const left = el('div');
  left.appendChild(el('div', 'card-title', r[category.titleField] || '(névtelen)'));
  left.appendChild(el('div', 'card-sub', [r.munkanem, r.megrendelo, r.kerte].filter(Boolean).join(' · ')));
  head.appendChild(left);
  if (r.prioritas) head.appendChild(prioBadge(r.prioritas));
  card.appendChild(head);

  const badges = el('div', 'badges');
  if (r.allapot) badges.appendChild(statusBadge(r.allapot));
  if (r.fizetes_statusz) badges.appendChild(payBadge(r.fizetes_statusz));
  if (r.hatarido) badges.appendChild(dueBadge(r.hatarido));
  card.appendChild(badges);

  const row = el('div', 'card-row');
  if (r.cim) row.appendChild(kv('Cím', r.cim));
  if (r.hrsz) row.appendChild(kv('HRSZ', r.hrsz));
  if (r.vallalt_dij) row.appendChild(kv('Díj', formatFt(parseNum(r.vallalt_dij))));
  if (row.childNodes.length) card.appendChild(row);

  if (r.kovetkezo_teendo) {
    const next = el('div', 'card-row');
    next.appendChild(kv('Köv. teendő', r.kovetkezo_teendo));
    card.appendChild(next);
  }

  // Napi munkanapló összegzése a kártyán (ha van ilyen mező a kategóriában)
  const naploField = category.fields.find(f => f.type === 'naplo');
  if (naploField && Array.isArray(r[naploField.key]) && r[naploField.key].length) {
    const entries = r[naploField.key].slice().sort((a, b) => (a.datum < b.datum ? 1 : -1));
    const last = entries[0];
    const naploRow = el('div', 'card-row');
    naploRow.appendChild(kv('Napló', last.datum.slice(5) + ': ' + last.szoveg));
    card.appendChild(naploRow);
    const weekCount = entries.filter(e => isThisWeek(e.datum)).length;
    if (weekCount) {
      const b = el('div', 'badges');
      b.appendChild(badge('📝 ' + weekCount + ' bejegyzés ezen a héten', 'blue'));
      card.appendChild(b);
    }
  }
  return card;
}
function kv(k, v) { const s = el('span'); s.innerHTML = '<b>' + esc(k) + ':</b> ' + esc(v); return s; }

/* ----------------------- táblázatnézet ----------------------- */
export function renderTable(rows, category, onOpen) {
  const cols = category.fields.filter(f => f.list);
  const wrap = el('div', 'table-wrap');
  const table = el('table', 'grid');
  const thead = el('thead'); const htr = el('tr');
  cols.forEach(c => htr.appendChild(el('th', null, c.label)));
  htr.appendChild(el('th', null, 'Fizetés'));
  thead.appendChild(htr); table.appendChild(thead);

  const tbody = el('tbody');
  rows.forEach(r => {
    const tr = el('tr');
    tr.onclick = () => onOpen(r);
    cols.forEach(c => {
      let v = r[c.key];
      if (c.type === 'number') v = v ? formatFt(parseNum(v)) : '';
      tr.appendChild(el('td', null, v || '—'));
    });
    const td = el('td');
    if (r.fizetes_statusz) td.appendChild(payBadge(r.fizetes_statusz));
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

/* ----------------------- űrlap (modál) ----------------------- */
export function buildForm(category, record) {
  const form = $('#recordForm'); form.innerHTML = '';
  category.fields.forEach(f => form.appendChild(buildField(f, record ? record[f.key] : '')));
}
function isWide(f) { return f.type === 'textarea' || f.type === 'multiselect' || f.type === 'naplo'; }

/** Egy napló-bejegyzés sora (dátum + szöveg + törlés), aktuális hét kiemelve */
function naploEntryEl(datum, szoveg) {
  const row = el('div', 'naplo-item' + (isThisWeek(datum) ? ' thisweek' : ''));
  row.dataset.datum = datum;
  row.dataset.szoveg = szoveg;
  row.appendChild(el('span', 'naplo-date', formatDateHu(datum)));
  row.appendChild(el('span', 'naplo-text', szoveg));
  const del = el('button', 'naplo-del', '✕'); del.type = 'button';
  del.title = 'Bejegyzés törlése';
  del.onclick = () => row.remove();
  row.appendChild(del);
  return row;
}
function buildField(f, value) {
  const wrap = el('div', 'field' + (isWide(f) ? ' full' : '') + (f.type === 'bool' ? ' switch' : ''));
  const lab = el('label', f.required ? 'req' : null, f.label);
  lab.htmlFor = 'f_' + f.key;
  let input;
  switch (f.type) {
    case 'textarea': input = el('textarea'); input.value = value || ''; break;
    case 'number': input = el('input'); input.type = 'number'; input.value = value || ''; break;
    case 'date': input = el('input'); input.type = 'date'; input.value = value || ''; break;
    case 'select':
      input = el('select');
      input.appendChild(el('option', null, '—'));
      f.options.forEach(o => { const op = el('option', null, o); op.value = o; if (o === value) op.selected = true; input.appendChild(op); });
      break;
    case 'bool':
      input = el('input'); input.type = 'checkbox';
      input.checked = (value === true || value === 'Igen' || value === 'igen');
      break;
    case 'naplo': {
      input = el('div', 'naplo');
      const list = el('div', 'naplo-list');
      const entries = (Array.isArray(value) ? value.slice() : [])
        .sort((a, b) => (a.datum < b.datum ? 1 : -1));     // legújabb elöl
      entries.forEach(e => list.appendChild(naploEntryEl(e.datum, e.szoveg)));
      input.appendChild(list);

      const addRow = el('div', 'naplo-add');
      const dateIn = el('input'); dateIn.type = 'date'; dateIn.value = todayStr();
      const textIn = el('input'); textIn.type = 'text'; textIn.placeholder = 'Mit csináltam ma…';
      const addBtn = el('button', 'btn small primary', '+ Hozzáad'); addBtn.type = 'button';
      addBtn.onclick = () => {
        const t = textIn.value.trim();
        if (!t) return;
        list.insertBefore(naploEntryEl(dateIn.value || todayStr(), t), list.firstChild);
        textIn.value = '';
        textIn.focus();
      };
      textIn.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); addBtn.click(); } });
      addRow.appendChild(dateIn); addRow.appendChild(textIn); addRow.appendChild(addBtn);
      input.appendChild(addRow);
      break;
    }
    case 'multiselect': {
      const box = el('div', 'ms');
      const sel = String(value || '').split(';').map(s => s.trim());
      f.options.forEach(o => {
        const l = el('label');
        const cb = el('input'); cb.type = 'checkbox'; cb.value = o; cb.dataset.ms = f.key;
        if (sel.includes(o)) cb.checked = true;
        l.appendChild(cb); l.appendChild(document.createTextNode(' ' + o));
        box.appendChild(l);
      });
      input = box;
      break;
    }
    default: input = el('input'); input.type = 'text'; input.value = value || '';
  }
  if (f.type !== 'multiselect') { input.id = 'f_' + f.key; input.dataset.key = f.key; }
  wrap.appendChild(lab); wrap.appendChild(input);
  return wrap;
}

/* ----------------------- napi napló nézet (önálló) ----------------------- */

/**
 * Napi napló nézet. entries: store-rekordok [{id, datum, szoveg}].
 * handlers: { onAdd(datum, szoveg), onDelete(id) }
 */
export function renderJournal(entries, handlers) {
  const wrap = el('div', 'journal');

  // Hozzáadó sor
  const add = el('div', 'journal-add');
  const dateIn = el('input'); dateIn.type = 'date'; dateIn.value = todayStr();
  const textIn = el('input'); textIn.type = 'text'; textIn.placeholder = 'Mit csináltam ma… (Enter a mentéshez)';
  const btn = el('button', 'btn primary', '+ Bejegyzés');
  const submit = () => {
    const t = textIn.value.trim();
    if (!t) return;
    handlers.onAdd(dateIn.value || todayStr(), t);
    textIn.value = '';
  };
  btn.onclick = submit;
  textIn.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); submit(); } });
  add.appendChild(dateIn); add.appendChild(textIn); add.appendChild(btn);
  wrap.appendChild(add);

  if (!entries.length) {
    wrap.appendChild(el('div', 'journal-empty', 'Még nincs bejegyzés. Írd be, mit csináltál ma!'));
    return wrap;
  }

  // Dátum szerint csoportosítva, legújabb nap elöl
  const byDay = {};
  entries.forEach(e => { (byDay[e.datum] = byDay[e.datum] || []).push(e); });
  Object.keys(byDay).sort((a, b) => (a < b ? 1 : -1)).forEach(datum => {
    const day = el('div', 'journal-day' + (isThisWeek(datum) ? ' thisweek' : ''));
    const head = el('div', 'journal-day-head');
    head.appendChild(el('span', null, formatDateHu(datum)));
    if (isThisWeek(datum)) head.appendChild(badge('ezen a héten', 'blue'));
    day.appendChild(head);
    const list = el('div', 'naplo-list');
    byDay[datum].forEach(e => {
      const row = el('div', 'naplo-item' + (isThisWeek(datum) ? ' thisweek' : ''));
      row.appendChild(el('span', 'naplo-text', e.szoveg));
      const del = el('button', 'naplo-del', '✕'); del.type = 'button'; del.title = 'Törlés';
      del.onclick = () => handlers.onDelete(e.id);
      row.appendChild(del);
      list.appendChild(row);
    });
    day.appendChild(list);
    wrap.appendChild(day);
  });
  return wrap;
}

/** Napló-statisztika az összesítő sávhoz */
export function journalStats(entries) {
  const week = entries.filter(e => isThisWeek(e.datum)).length;
  return { total: entries.length, week };
}

export function collectForm(category, editingId) {
  const rec = {};
  if (editingId) rec.id = editingId;
  category.fields.forEach(f => {
    if (f.type === 'multiselect') {
      rec[f.key] = Array.from(document.querySelectorAll('[data-ms="' + f.key + '"]:checked')).map(c => c.value).join('; ');
    } else if (f.type === 'naplo') {
      const cont = $('#f_' + f.key);
      rec[f.key] = cont
        ? Array.from(cont.querySelectorAll('.naplo-item')).map(it => ({ datum: it.dataset.datum, szoveg: it.dataset.szoveg }))
        : [];
    } else if (f.type === 'bool') {
      rec[f.key] = $('#f_' + f.key).checked ? 'Igen' : 'Nem';
    } else {
      let v = $('#f_' + f.key).value;
      if (f.type === 'select' && v === '—') v = '';
      rec[f.key] = v;
    }
  });
  return rec;
}
