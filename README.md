# 🗂️ Munkanyilvántartó

Grafikus webes munkanyilvántartó **építészeti ügyintézéshez** és **épületenergetikai
munkákhoz**. Egyszerű, statikus webalkalmazás (nincs telepítés, nincs build):

- **Azonnal működik** – megnyitod a linket, és helyi (demo) módban, mintaadattal
  rögtön használhatod.
- **Több eszközös felhő-szinkron** – ha kapcsolódsz egy ingyenes **Supabase**
  háttérhez, az adataid laptopon és telefonon is szinkronban lesznek.
- **GitHub Pages** – publikus link, bárhonnan elérhető.

## Mit tud?

- **Két fül (bővíthető):** 📐 Építészeti munkák · ⚡ Épületenergetika
- Projektenként: **jelenlegi állapot**, cél, határidő, prioritás, szakág bevonása
  (gépész/elektromos/statikus/földmérő), megrendelő + elérhetőség, vállalt díj,
  fizetés státusza, **mit mondtál a megrendelőnek**, következő teendő, és sok más.
- **Előre beállított legördülők** – csak kiválasztod az értéket.
- **Kártya- és táblázatnézet**, keresés, állapot- és fizetés-szűrő, lezártak elrejtése.
- **Összesítő sáv:** összes / nyitott munka, rendezetlen fizetések, **kintlévőség (Ft)**.
- Színes jelzések: állapot, fizetés, **lejárt / közeli határidő**.

---

## 1. Megnyitás (GitHub Pages)

A felület telepítés nélkül fut. A publikus link bekapcsolása:

1. A repó GitHubon: **Settings → Pages**.
2. „Build and deployment" → **Source: Deploy from a branch**.
3. Branch: **`claude/exciting-noether-pucul8`** (vagy amelyikre a fájlok kerültek),
   mappa: **`/ (root)`** → **Save**.
4. Egy percen belül kapsz egy linket (kb. `https://csoky256.github.io/munkny-lv-ntart-agent/`).
   Nyisd meg, és tedd ki könyvjelzőbe / a telefon kezdőképernyőjére.

Ennyi – a felület **helyi módban** azonnal működik mintaadattal. A több eszközös
szinkronhoz folytasd a 2. lépéssel.

> Helyben is kipróbálható: a repó gyökerében `python3 -m http.server`, majd
> böngészőben `http://localhost:8000`. (Csak fájlként megnyitva az ES-modulok nem
> mindig töltődnek – ezért érdemes a kis szervert vagy a GitHub Pages-t használni.)

---

## 2. Felhő-szinkron bekapcsolása (Supabase, ingyenes) – opcionális

Ez kell ahhoz, hogy ugyanazt az adatot lásd több eszközön. Egyszeri beállítás:

1. Regisztrálj a **[supabase.com](https://supabase.com)** oldalon, és hozz létre egy
   ingyenes **New project**-et (jegyezd meg az adatbázis-jelszót, de itt nem kell).
2. A projektben: **SQL Editor → New query** → másold be a repó
   [`supabase/schema.sql`](supabase/schema.sql) teljes tartalmát → **Run**.
   (Létrehozza a `works` táblát és a biztonsági szabályokat.)
3. **Project Settings → API**: másold ki a **Project URL**-t és az **anon public**
   kulcsot.
4. Nyisd meg a Munkanyilvántartó felületet → jobbra fent **⚙️ Beállítások**.
   - Illeszd be a Project URL-t és az anon kulcsot → **Kapcsolat mentése**.
   - Lentebb **Regisztráció** az e-mail-címeddel és egy jelszóval (ez lesz a saját
     fiókod), majd **Bejelentkezés**.
5. A fejlécben megjelenik a **☁️ Felhő – e-mail** jelzés. Készen vagy!

> A mintaadatok helyben maradnak. Ha fel szeretnéd tölteni őket a felhőbe, a
> Beállítások panelen: **„Helyi adatok feltöltése a felhőbe"**.

### Biztonság

- A felület publikus (GitHub Pages), de az **anon kulcs ettől még biztonságos** –
  designból publikus. A védelmet a **Supabase Auth + Row Level Security** adja:
  bejelentkezés nélkül semmi nem érhető el, és **mindenki csak a saját adatait**
  látja (`auth.uid() = user_id`).
- A Supabase URL+kulcs a böngésződ `localStorage`-ában van, **nem** a repóban.
- Új eszközön egyszer megadod a URL-t/kulcsot a Beállításokban és bejelentkezel.

---

## Bővítés (új fül vagy mező)

Minden a [`js/schema.js`](js/schema.js) **`CONFIG`** objektumából jön – az űrlapok,
kártyák, szűrők és a tárolás is ehhez igazodik. Mivel a tárolás JSON(B), új mező
**nem igényel adatbázis-migrációt**.

- **Új mező:** vegyél fel egy elemet a kategória `fields` tömbjébe, pl.:
  ```js
  { key: 'tervezo', label: 'Felelős tervező', type: 'text' }
  ```
  Típusok: `text`, `textarea`, `number`, `date`, `select` (+`options`),
  `multiselect` (+`options`), `bool`. `list: true` → kiemelt a kártyán/táblázatban,
  `required: true` → kötelező.
- **Új munkanem:** bővítsd az adott `munkanem` mező `options` listáját.
- **Új fül (kategória):** adj hozzá egy új blokkot a `categories` tömbhöz.

Commit + push után a GitHub Pages magától frissül.

---

## Fájlszerkezet

```
index.html             – a felület váza
css/styles.css         – stílus
js/schema.js           – CONFIG: fülek + mezők (itt bővíthető)
js/sampleData.js       – minta munkák (helyi módhoz)
js/store.js            – adatréteg (LocalStore + CloudStore közös API)
js/supabaseClient.js   – Supabase kapcsolat (CDN-ről, configból)
js/auth.js             – bejelentkezés / regisztráció
js/ui.js               – megjelenítés (kártya, táblázat, badge, űrlap)
js/app.js              – vezérlő (állapot, események, beállítás-panel)
supabase/schema.sql    – Supabase tábla + jogosultságok
```

## Később hozzáadható

- Határidő → **Google Naptár** bejegyzés
- Közeli határidő / fizetetlen díj → **e-mail emlékeztető**

Szólj, ha ezeket bekapcsoljuk.
