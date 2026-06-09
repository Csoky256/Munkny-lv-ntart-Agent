/**
 * Munkanyilvántartó – Google Apps Script webalkalmazás
 * Adattárolás: a táblázathoz kötött Google Sheet, kategóriánként egy munkalap.
 *
 * BŐVÍTHETŐSÉG:
 *   Az alkalmazás teljesen "config-vezérelt". Az alábbi CONFIG objektum írja le
 *   a füleket (kategóriákat) és azok mezőit. Új fül vagy új mező hozzáadásához
 *   elég ezt a CONFIG-ot bővíteni – a táblázat oszlopai és a webes űrlap is
 *   automatikusan ehhez igazodnak.
 *
 *   Mezőtípusok: text, textarea, number, date, select, multiselect, bool
 */

const CONFIG = {
  appName: 'Munkanyilvántartó',
  categories: [
    {
      key: 'epiteszet',
      label: 'Építészeti munkák',
      icon: '📐',
      sheet: 'Építészet',
      // Mely mező legyen a kártya címe / a fő keresőmező
      titleField: 'nev',
      fields: [
        { key: 'nev', label: 'Projekt megnevezése', type: 'text', required: true, list: true },
        { key: 'munkanem', label: 'Munkanem', type: 'select', list: true, options: [
            'Hatósági bizonyítvány', 'Fennmaradási engedély', 'Építési engedély',
            'Egyszerű bejelentés', 'Építészeti rajzolás', 'Tartószerkezeti rajzolás'
        ]},
        { key: 'allapot', label: 'Jelenlegi állapot', type: 'select', list: true, badge: true, options: [
            'Egyeztetés alatt', 'Adatgyűjtés', 'Felmérés', 'Tervezés folyamatban',
            'Egyeztetésre vár', 'Hatóságnál / beadva', 'Hiánypótlás', 'Jóváhagyva',
            'Lezárva', 'Felfüggesztve'
        ]},
        { key: 'cel', label: 'Cél (mit kell elérni)', type: 'textarea' },
        { key: 'hatarido', label: 'Határidő', type: 'date', list: true },
        { key: 'prioritas', label: 'Prioritás', type: 'select', list: true, options: [
            'Alacsony', 'Közepes', 'Magas', 'Sürgős'
        ]},
        { key: 'szakag_kell', label: 'Kell-e szakág bevonása', type: 'bool' },
        { key: 'szakagak', label: 'Bevonandó szakág(ak)', type: 'multiselect', options: [
            'Gépész', 'Elektromos', 'Statikus', 'Földmérő'
        ]},
        { key: 'cim', label: 'Ingatlan címe', type: 'text' },
        { key: 'hrsz', label: 'Helyrajzi szám (HRSZ)', type: 'text' },
        { key: 'etdr', label: 'ÉTDR / ügyiratszám', type: 'text' },
        { key: 'megrendelo', label: 'Megrendelő', type: 'text', list: true },
        { key: 'megrendelo_elerhetoseg', label: 'Megrendelő elérhetősége (tel./e-mail)', type: 'text' },
        { key: 'vallalt_dij', label: 'Vállalt díj (Ft)', type: 'number', list: true },
        { key: 'fizetes_statusz', label: 'Fizetés státusza', type: 'select', list: true, badge: true, options: [
            'Nem fizetett', 'Részben fizetett', 'Kifizetve'
        ]},
        { key: 'fizetett_osszeg', label: 'Fizetett összeg (Ft)', type: 'number' },
        { key: 'szamlazva', label: 'Számlázva', type: 'select', options: [
            'Nincs', 'Kiállítva', 'Kifizetve'
        ]},
        { key: 'utolso_egyeztetes', label: 'Utolsó egyeztetés dátuma', type: 'date' },
        { key: 'megrendelonek_mondva', label: 'Mit mondtam a megrendelőnek', type: 'textarea' },
        { key: 'kovetkezo_teendo', label: 'Következő teendő', type: 'text' },
        { key: 'dok_link', label: 'Dokumentumok linkje (Drive)', type: 'text' },
        { key: 'megjegyzes', label: 'Megjegyzés', type: 'textarea' }
      ]
    },
    {
      key: 'energetika',
      label: 'Épületenergetika',
      icon: '⚡',
      sheet: 'Energetika',
      titleField: 'nev',
      fields: [
        { key: 'nev', label: 'Projekt megnevezése', type: 'text', required: true, list: true },
        { key: 'munkanem', label: 'Munkanem', type: 'select', list: true, options: [
            'HET', 'Energetikai számítás', 'Pályázat'
        ]},
        { key: 'palyazat_neve', label: 'Melyik pályázat (ha pályázat)', type: 'text' },
        { key: 'nyilatkozat_kell', label: 'Kell-e nyilatkozat', type: 'bool' },
        { key: 'allapot', label: 'Jelenlegi állapot', type: 'select', list: true, badge: true, options: [
            'Egyeztetés alatt', 'Adatgyűjtés', 'Számítás folyamatban', 'Kész',
            'Beadva', 'Lezárva', 'Felfüggesztve'
        ]},
        { key: 'hatarido', label: 'Határidő', type: 'date', list: true },
        { key: 'prioritas', label: 'Prioritás', type: 'select', list: true, options: [
            'Alacsony', 'Közepes', 'Magas', 'Sürgős'
        ]},
        { key: 'cim', label: 'Ingatlan címe', type: 'text' },
        { key: 'hrsz', label: 'Helyrajzi szám (HRSZ)', type: 'text' },
        { key: 'megrendelo', label: 'Megrendelő', type: 'text', list: true },
        { key: 'megrendelo_elerhetoseg', label: 'Megrendelő elérhetősége (tel./e-mail)', type: 'text' },
        { key: 'vallalt_dij', label: 'Vállalt díj (Ft)', type: 'number', list: true },
        { key: 'fizetes_statusz', label: 'Fizetés státusza', type: 'select', list: true, badge: true, options: [
            'Nem fizetett', 'Részben fizetett', 'Kifizetve'
        ]},
        { key: 'fizetett_osszeg', label: 'Fizetett összeg (Ft)', type: 'number' },
        { key: 'utolso_egyeztetes', label: 'Utolsó egyeztetés dátuma', type: 'date' },
        { key: 'megrendelonek_mondva', label: 'Mit mondtam a megrendelőnek', type: 'textarea' },
        { key: 'kovetkezo_teendo', label: 'Következő teendő', type: 'text' },
        { key: 'dok_link', label: 'Dokumentumok linkje (Drive)', type: 'text' },
        { key: 'megjegyzes', label: 'Megjegyzés', type: 'textarea' }
      ]
    }
  ]
};

// Minden munkalap rejtett szolgáltatás-oszlopai (a mezők előtt/után)
const META_HEADERS = ['__id', '__letrehozva', '__modositva'];

/** Webalkalmazás belépési pont */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.appName)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://ssl.gstatic.com/docs/script/images/favicon.ico');
}

/** Részsablonok beemelése a HTML-be (CSS/JS szétbontáshoz) */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** A kliens lekéri a teljes konfigurációt (fülek + mezők) */
function getConfig() {
  return CONFIG;
}

/* ----------------------------- Segédek ----------------------------- */

function findCategory_(categoryKey) {
  const cat = CONFIG.categories.find(c => c.key === categoryKey);
  if (!cat) throw new Error('Ismeretlen kategória: ' + categoryKey);
  return cat;
}

function headerOrder_(cat) {
  // Oszlopsorrend: meta + a config mezői (a config a forrás)
  return META_HEADERS.concat(cat.fields.map(f => f.key));
}

/** Munkalap megnyitása / létrehozása helyes fejléccel */
function getSheet_(cat) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(cat.sheet);
  const headers = headerOrder_(cat);
  if (!sheet) {
    sheet = ss.insertSheet(cat.sheet);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  // Fejléc szinkronizálása: hiányzó oszlopok pótlása a végén (nem törlünk adatot)
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  let changed = false;
  headers.forEach(h => {
    if (existing.indexOf(h) === -1) {
      existing.push(h);
      changed = true;
    }
  });
  if (changed) {
    sheet.getRange(1, 1, 1, existing.length).setValues([existing]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

/* ----------------------------- CRUD ----------------------------- */

/** Egy kategória összes rekordjának lekérése objektumtömbként */
function listRecords(categoryKey) {
  const cat = findCategory_(categoryKey);
  const sheet = getSheet_(cat);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const headers = sheetHeaders_(sheet);
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const records = [];
  values.forEach(row => {
    const rec = {};
    headers.forEach((h, i) => {
      let v = row[i];
      if (v instanceof Date) {
        v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      rec[h] = v === '' ? '' : v;
    });
    if (rec.__id) records.push(rec);
  });
  return records;
}

/** Rekord létrehozása vagy frissítése. record.__id üres => új. */
function saveRecord(categoryKey, record) {
  const cat = findCategory_(categoryKey);
  const sheet = getSheet_(cat);
  const headers = sheetHeaders_(sheet);
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    let id = record.__id;
    if (id) {
      // Frissítés: keressük a sort az __id alapján
      const rowIndex = findRowById_(sheet, headers, id);
      if (rowIndex === -1) throw new Error('A rekord nem található (id: ' + id + ')');
      const existing = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
      const rowObj = {};
      headers.forEach((h, i) => rowObj[h] = existing[i]);
      // mezők frissítése
      cat.fields.forEach(f => { rowObj[f.key] = normalizeValue_(record[f.key]); });
      rowObj.__modositva = now;
      const newRow = headers.map(h => rowObj[h] === undefined ? '' : rowObj[h]);
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([newRow]);
      return id;
    } else {
      // Új rekord
      id = Utilities.getUuid();
      const rowObj = { __id: id, __letrehozva: now, __modositva: now };
      cat.fields.forEach(f => { rowObj[f.key] = normalizeValue_(record[f.key]); });
      const newRow = headers.map(h => rowObj[h] === undefined ? '' : rowObj[h]);
      sheet.appendRow(newRow);
      return id;
    }
  } finally {
    lock.releaseLock();
  }
}

/** Rekord törlése */
function deleteRecord(categoryKey, id) {
  const cat = findCategory_(categoryKey);
  const sheet = getSheet_(cat);
  const headers = sheetHeaders_(sheet);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const rowIndex = findRowById_(sheet, headers, id);
    if (rowIndex === -1) throw new Error('A rekord nem található (id: ' + id + ')');
    sheet.deleteRow(rowIndex);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function findRowById_(sheet, headers, id) {
  const idCol = headers.indexOf('__id') + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || idCol < 1) return -1;
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

/** Tömb (multiselect) ; -vel összefűzve tárolódik */
function normalizeValue_(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.join('; ');
  if (v === true) return 'Igen';
  if (v === false) return 'Nem';
  return v;
}

/** Egyszeri inicializálás: létrehozza a munkalapokat. A táblázat menüjéből futtatható. */
function setup() {
  CONFIG.categories.forEach(c => getSheet_(c));
  SpreadsheetApp.getActiveSpreadsheet().toast('Munkalapok készen állnak.', CONFIG.appName, 5);
}

/** Menü a táblázatban (kényelmi) */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(CONFIG.appName)
    .addItem('Munkalapok inicializálása', 'setup')
    .addToUi();
}
