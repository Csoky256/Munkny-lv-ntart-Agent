/**
 * Adatséma – config-vezérelt felépítés.
 *
 * Ez az egyetlen hely, ahol a "fülek" (kategóriák) és a mezők le vannak írva.
 * Az űrlapok, a kártyák, a szűrők és a tárolás is ehhez igazodik automatikusan.
 *
 * BŐVÍTÉS:
 *   - Új munkanem  -> bővítsd a megfelelő mező `options` listáját.
 *   - Új mező      -> vegyél fel egy elemet a kategória `fields` tömbjébe.
 *   - Új fül       -> adj hozzá egy új blokkot a `categories` tömbhöz.
 *
 * Mezőtípusok: text, textarea, number, date, select, multiselect, bool
 *   - `required: true` -> kötelező mező
 *   - `list: true`     -> a kártyán / keresésben kiemelt
 *   - `badge: true`    -> színes címke a kártyán
 */

/**
 * Építészeti mezőkészlet. Közös, hogy több fül (pl. Építészet és BKM Zrt.)
 * pontosan ugyanazokat a mezőket használhassa. Ha külön akarod szabni őket,
 * másold le ezt a tömböt az adott kategóriához és ott módosítsd.
 */
const EPITESZET_FIELDS = [
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
];

/**
 * BKM Zrt. mezőkészlet: az építészeti mezők fizetés nélkül, plusz egy
 * "Napi munkanapló" mező (dátumozott bejegyzések) a heti pénteki meetinghez.
 */
const BKM_FIELDS = (() => {
  const PAYMENT = ['vallalt_dij', 'fizetes_statusz', 'fizetett_osszeg', 'szamlazva'];
  const base = EPITESZET_FIELDS.filter(f => !PAYMENT.includes(f.key));
  const naplo = { key: 'naplo', label: 'Napi munkanapló (a pénteki meetinghez)', type: 'naplo' };
  const idx = base.findIndex(f => f.key === 'cel');           // a Cél után helyezzük
  base.splice(idx + 1, 0, naplo);
  return base;
})();

export const CONFIG = {
  appName: 'Munkanyilvántartó',
  categories: [
    {
      key: 'epiteszet',
      label: 'Építészeti munkák',
      icon: '📐',
      titleField: 'nev',
      fields: EPITESZET_FIELDS
    },
    {
      key: 'energetika',
      label: 'Épületenergetika',
      icon: '⚡',
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
    },
    {
      key: 'bkm',
      label: 'BKM Zrt.',
      icon: '🏢',
      titleField: 'nev',
      fields: BKM_FIELDS  // építészeti mezők fizetés nélkül + napi munkanapló
    }
  ]
};

/** Kategória keresése kulcs alapján */
export function getCategory(key) {
  return CONFIG.categories.find(c => c.key === key);
}

/** Egy kategória mezőjének definíciója */
export function getField(category, fieldKey) {
  return category.fields.find(f => f.key === fieldKey);
}
