/**
 * Vezérlő – állapot, események összekötése, beállítás/felhő-panel.
 */

import { CONFIG, getCategory, BKM_NAPLO_KEY } from './schema.js';
import { storeFor, localStore, cloudStore } from './store.js';
import { isConfigured, getSupabaseConfig, setSupabaseConfig } from './supabaseClient.js';
import { getUser, signIn, signUp, signOut } from './auth.js';
import {
  $, el, toast, showLoader,
  renderTabs, populateStatusFilter, renderSummary, renderCards, renderTable,
  buildForm, collectForm, renderJournal, journalStats
} from './ui.js';

const state = {
  mode: 'local',          // 'local' | 'cloud'
  user: null,             // bejelentkezett felhasználó (felhő módban)
  catKey: CONFIG.categories[0].key,
  view: 'cards',          // 'cards' | 'table'
  bkmView: 'munkak',      // BKM fül alnézete: 'munkak' | 'naplo'
  records: [],
  journal: [],
  editingId: null
};

/** Igaz, ha épp a BKM napi napló nézetét mutatjuk */
function isJournalView() { return state.catKey === 'bkm' && state.bkmView === 'naplo'; }

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await resolveMode();
  $('#appTitle').textContent = CONFIG.appName;
  renderTabs(CONFIG.categories, state.catKey, selectCategory);
  populateStatusFilter(getCategory(state.catKey));
  wireEvents();
  updateConnBadge();
  await load();
}

/** Eldönti, hogy helyi vagy felhő módban vagyunk-e */
async function resolveMode() {
  if (isConfigured()) {
    try {
      const user = await getUser();
      if (user) { state.mode = 'cloud'; state.user = user; return; }
    } catch { /* kapcsolat hiba -> marad helyi */ }
  }
  state.mode = 'local';
  state.user = null;
}

function store() { return storeFor(state.mode); }

function updateConnBadge() {
  const b = $('#connBadge');
  if (state.mode === 'cloud' && state.user) {
    b.className = 'conn-badge cloud';
    b.textContent = '☁️ Felhő – ' + (state.user.email || 'belépve');
  } else {
    b.className = 'conn-badge local';
    b.textContent = isConfigured() ? 'Helyi mód (nincs belépve)' : 'Helyi mód';
  }
}

function wireEvents() {
  $('#addBtn').onclick = () => openModal(null);
  $('#modalClose').onclick = $('#cancelBtn').onclick = closeModal;
  $('#saveBtn').onclick = save;
  $('#deleteBtn').onclick = remove;
  $('#search').oninput = render;
  $('#statusFilter').onchange = render;
  $('#payFilter').onchange = render;
  $('#hideClosed').onchange = render;
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  $('#viewToggle').querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      state.view = btn.dataset.view;
      $('#viewToggle').querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
      render();
    };
  });

  $('#settingsBtn').onclick = openSettings;
  $('#settingsClose').onclick = () => { $('#settingsModal').hidden = true; };
  $('#settingsModal').addEventListener('click', e => { if (e.target.id === 'settingsModal') $('#settingsModal').hidden = true; });
}

function selectCategory(key) {
  state.catKey = key;
  state.bkmView = 'munkak';
  renderTabs(CONFIG.categories, key, selectCategory);
  populateStatusFilter(getCategory(key));
  $('#search').value = '';
  $('#statusFilter').value = '';
  $('#payFilter').value = '';
  load();
}

/** BKM alfül-kapcsoló (Munkák / Napi napló) megjelenítése */
function updateSubnav() {
  const nav = $('#subnav');
  if (state.catKey !== 'bkm') { nav.hidden = true; nav.innerHTML = ''; return; }
  nav.hidden = false; nav.innerHTML = '';
  [['munkak', '📋 Munkák'], ['naplo', '📝 Napi napló']].forEach(([key, label]) => {
    const b = el('button', state.bkmView === key ? 'active' : null, label);
    b.onclick = () => { if (state.bkmView !== key) { state.bkmView = key; load(); } };
    nav.appendChild(b);
  });
}

async function load() {
  updateSubnav();
  $('#toolbar').hidden = isJournalView();
  showLoader(true);
  try {
    if (isJournalView()) {
      state.journal = await store().list(BKM_NAPLO_KEY);
      renderJournalView();
    } else {
      state.records = await store().list(state.catKey);
      render();
    }
  } catch (err) {
    onError(err);
  } finally {
    showLoader(false);
  }
}

/* ----------------------- napi napló nézet ----------------------- */

function renderJournalView() {
  const entries = state.journal.map(r => ({ id: r.id, datum: r.datum, szoveg: r.szoveg }));
  const st = journalStats(entries);
  const s = $('#summary'); s.innerHTML = '';
  s.appendChild(miniStat(st.week, 'bejegyzés ezen a héten'));
  s.appendChild(miniStat(st.total, 'összes bejegyzés'));

  $('#emptyState').hidden = true;
  const content = $('#content'); content.innerHTML = '';
  content.appendChild(renderJournal(entries, {
    onAdd: addJournalEntry,
    onDelete: deleteJournalEntry,
    meta: { who: (state.user && state.user.email) || '' }
  }));
}

function miniStat(num, lbl) {
  const d = el('div', 'stat');
  d.appendChild(el('div', 'num', String(num)));
  d.appendChild(el('div', 'lbl', lbl));
  return d;
}

async function addJournalEntry(datum, szoveg) {
  showLoader(true);
  try {
    await store().save(BKM_NAPLO_KEY, { datum, szoveg });
    state.journal = await store().list(BKM_NAPLO_KEY);
    renderJournalView();
    toast('Bejegyzés mentve ✓');
  } catch (err) { onError(err); }
  finally { showLoader(false); }
}

async function deleteJournalEntry(id) {
  if (!confirm('Törlöd ezt a naplóbejegyzést?')) return;
  showLoader(true);
  try {
    await store().remove(BKM_NAPLO_KEY, id);
    state.journal = await store().list(BKM_NAPLO_KEY);
    renderJournalView();
  } catch (err) { onError(err); }
  finally { showLoader(false); }
}

/* ----------------------- megjelenítés ----------------------- */

function render() {
  const cat = getCategory(state.catKey);
  const q = $('#search').value.trim().toLowerCase();
  const status = $('#statusFilter').value;
  const pay = $('#payFilter').value;
  const hideClosed = $('#hideClosed').checked;

  let rows = state.records.filter(r => {
    if (status && r.allapot !== status) return false;
    if (pay && r.fizetes_statusz !== pay) return false;
    if (hideClosed && /lezár/i.test(r.allapot || '')) return false;
    if (q) {
      const hay = [r.nev, r.megrendelo, r.kerte, r.cim, r.hrsz, r.etdr, r.munkanem].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  rows.sort((a, b) => (a.hatarido || '9999') < (b.hatarido || '9999') ? -1 : 1);

  renderSummary(rows, cat);

  const content = $('#content');
  content.innerHTML = '';
  $('#emptyState').hidden = rows.length !== 0;
  if (rows.length) {
    content.appendChild(state.view === 'table' ? renderTable(rows, cat, openModal) : renderCards(rows, cat, openModal));
  }
}

/* ----------------------- modál / mentés ----------------------- */

function openModal(rec) {
  const cat = getCategory(state.catKey);
  state.editingId = rec ? rec.id : null;
  $('#modalTitle').textContent = rec ? 'Munka szerkesztése' : 'Új munka – ' + cat.label;
  $('#deleteBtn').hidden = !rec;
  buildForm(cat, rec);
  $('#modal').hidden = false;
}
function closeModal() { $('#modal').hidden = true; state.editingId = null; }

async function save() {
  const cat = getCategory(state.catKey);
  const rec = collectForm(cat, state.editingId);
  const reqField = cat.fields.find(f => f.required);
  if (reqField && !String(rec[reqField.key] || '').trim()) {
    toast('A(z) „' + reqField.label + '" mező kötelező.');
    return;
  }
  showLoader(true);
  try {
    await store().save(state.catKey, rec);
    closeModal();
    toast('Mentve ✓');
    await load();
  } catch (err) { onError(err); }
  finally { showLoader(false); }
}

async function remove() {
  if (!state.editingId) return;
  if (!confirm('Biztosan törlöd ezt a munkát? A művelet nem vonható vissza.')) return;
  showLoader(true);
  try {
    await store().remove(state.catKey, state.editingId);
    closeModal();
    toast('Törölve');
    await load();
  } catch (err) { onError(err); }
  finally { showLoader(false); }
}

/* ----------------------- beállítások / felhő ----------------------- */

function openSettings() {
  renderSettings();
  $('#settingsModal').hidden = false;
}

function renderSettings() {
  const body = $('#settingsBody');
  body.innerHTML = '';
  const cfg = getSupabaseConfig();

  // 1) Állapot
  const s1 = section('Jelenlegi mód');
  const modeP = el('p', null, state.mode === 'cloud'
    ? '☁️ Felhő mód – belépve: ' + (state.user?.email || '') + '. Az adataid minden eszközön szinkronban vannak.'
    : (isConfigured()
        ? 'Helyi mód. A felhő be van állítva, de nem vagy bejelentkezve.'
        : 'Helyi mód. Az adatok ebben a böngészőben tárolódnak. A több eszközös szinkronhoz kapcsolódj a felhőhöz alább.'));
  s1.appendChild(modeP);
  body.appendChild(s1);

  // 2) Supabase kapcsolat
  const s2 = section('1. Felhő (Supabase) kapcsolat');
  s2.appendChild(el('p', null, 'Illeszd be a Supabase projekted adatait. Ezek a böngésződben tárolódnak, a repóba nem kerülnek.'));
  const urlIn = inputRow('Project URL (pl. https://abcd.supabase.co)', cfg?.url || '');
  const keyIn = inputRow('anon public kulcs', cfg?.anonKey || '');
  s2.appendChild(urlIn.label); s2.appendChild(urlIn.input);
  s2.appendChild(keyIn.label); s2.appendChild(keyIn.input);
  const row2 = el('div', 'row');
  const saveCfgBtn = el('button', 'btn primary small', 'Kapcsolat mentése');
  saveCfgBtn.onclick = () => {
    setSupabaseConfig({ url: urlIn.input.value, anonKey: keyIn.input.value });
    toast('Kapcsolat elmentve.');
    renderSettings(); updateConnBadge();
  };
  row2.appendChild(saveCfgBtn);
  if (cfg) {
    const clrBtn = el('button', 'btn ghost small', 'Kapcsolat törlése');
    clrBtn.onclick = async () => { try { await signOut(); } catch {} setSupabaseConfig(null); state.mode = 'local'; state.user = null; toast('Kapcsolat törölve.'); renderSettings(); updateConnBadge(); load(); };
    row2.appendChild(clrBtn);
  }
  s2.appendChild(row2);
  const help = el('ul', 'steps');
  ['Hozz létre ingyenes projektet a supabase.com oldalon.',
   'A projektben: SQL Editor → másold be a repó supabase/schema.sql tartalmát → Run.',
   'Project Settings → API → innen másold a Project URL-t és az anon public kulcsot.'
  ].forEach(t => help.appendChild(el('li', null, t)));
  s2.appendChild(help);
  body.appendChild(s2);

  // 3) Bejelentkezés (csak ha van konfiguráció)
  if (isConfigured()) {
    const s3 = section('2. Bejelentkezés');
    if (state.mode === 'cloud' && state.user) {
      s3.appendChild(el('p', null, 'Belépve: ' + state.user.email));
      const row = el('div', 'row');
      const outBtn = el('button', 'btn ghost small', 'Kijelentkezés');
      outBtn.onclick = async () => { showLoader(true); try { await signOut(); state.mode = 'local'; state.user = null; toast('Kijelentkeztél.'); renderSettings(); updateConnBadge(); await load(); } catch (e) { onError(e); } finally { showLoader(false); } };
      const migBtn = el('button', 'btn primary small', 'Helyi adatok feltöltése a felhőbe');
      migBtn.onclick = migrateLocalToCloud;
      row.appendChild(migBtn); row.appendChild(outBtn);
      s3.appendChild(row);
    } else {
      const emailIn = inputRow('E-mail', '');
      const passIn = inputRow('Jelszó', ''); passIn.input.type = 'password';
      s3.appendChild(emailIn.label); s3.appendChild(emailIn.input);
      s3.appendChild(passIn.label); s3.appendChild(passIn.input);
      const row = el('div', 'row');
      const inBtn = el('button', 'btn primary small', 'Bejelentkezés');
      inBtn.onclick = () => doAuth('in', emailIn.input.value, passIn.input.value, s3);
      const upBtn = el('button', 'btn ghost small', 'Regisztráció');
      upBtn.onclick = () => doAuth('up', emailIn.input.value, passIn.input.value, s3);
      row.appendChild(inBtn); row.appendChild(upBtn);
      s3.appendChild(row);
    }
    body.appendChild(s3);
  }

  // 4) Helyi adatok
  const s4 = section('Helyi adatok');
  const row4 = el('div', 'row');
  const clearBtn = el('button', 'btn danger ghost small', 'Helyi adatok törlése (és minta visszatöltése)');
  clearBtn.onclick = () => {
    if (!confirm('Biztosan törlöd az összes helyi adatot? A minta munkák visszatöltődnek.')) return;
    localStore.clearAll(); localStore._ensureSeed();
    toast('Helyi adatok visszaállítva.');
    if (state.mode === 'local') load();
  };
  row4.appendChild(clearBtn);
  s4.appendChild(row4);
  body.appendChild(s4);
}

function section(title) { const s = el('div', 'sec'); s.appendChild(el('h3', null, title)); return s; }
function inputRow(labelText, value) {
  const label = el('label', null, labelText);
  const input = el('input'); input.value = value || '';
  return { label, input };
}

async function doAuth(kind, email, password, sectionEl) {
  if (!email || !password) { toast('Add meg az e-mailt és a jelszót.'); return; }
  showLoader(true);
  try {
    if (kind === 'up') {
      const res = await signUp(email, password);
      if (!res.session) { toast('Regisztráció kész. Ha e-mail megerősítés kell, kattints a levélben lévő linkre, majd jelentkezz be.'); showLoader(false); return; }
    } else {
      await signIn(email, password);
    }
    state.user = await getUser();
    state.mode = state.user ? 'cloud' : 'local';
    toast('Sikeres bejelentkezés.');
    renderSettings(); updateConnBadge();
    await load();
  } catch (err) {
    onError(err);
  } finally { showLoader(false); }
}

async function migrateLocalToCloud() {
  if (!confirm('Feltöltöd a helyi munkákat a felhőbe? (A meglévő felhős adatok megmaradnak, a helyiek hozzáadódnak.)')) return;
  showLoader(true);
  try {
    const local = await localStore.exportAll();
    const n = await cloudStore.importAll(local);
    toast(n + ' munka feltöltve a felhőbe.');
    await load();
  } catch (err) { onError(err); }
  finally { showLoader(false); }
}

function onError(err) {
  showLoader(false);
  const msg = err && err.message ? err.message : String(err);
  toast('Hiba: ' + msg);
  console.error(err);
}
