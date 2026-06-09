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
export function renderSummary(rows) {
  const total = rows.length;
  const open = rows.filter(r => !/lezár/i.test(r.allapot || '')).length;
  const unpaid = rows.filter(r => r.fizetes_statusz && r.fizetes_statusz !== 'Kifizetve').length;
  const owed = rows.reduce((s, r) => {
    if (r.fizetes_statusz === 'Kifizetve') return s;
    return s + Math.max(parseNum(r.vallalt_dij) - parseNum(r.fizetett_osszeg), 0);
  }, 0);
  const s = $('#summary'); s.innerHTML = '';
  s.appendChild(stat(total, 'munka összesen'));
  s.appendChild(stat(open, 'nyitott'));
  s.appendChild(stat(unpaid, 'rendezetlen fizetés'));
  s.appendChild(stat(formatFt(owed), 'kintlévőség'));
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
  left.appendChild(el('div', 'card-sub', [r.munkanem, r.megrendelo].filter(Boolean).join(' · ')));
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
function isWide(f) { return f.type === 'textarea' || f.type === 'multiselect'; }
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

export function collectForm(category, editingId) {
  const rec = {};
  if (editingId) rec.id = editingId;
  category.fields.forEach(f => {
    if (f.type === 'multiselect') {
      rec[f.key] = Array.from(document.querySelectorAll('[data-ms="' + f.key + '"]:checked')).map(c => c.value).join('; ');
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
