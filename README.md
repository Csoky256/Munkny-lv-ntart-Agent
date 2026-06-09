# 🗂️ Munkanyilvántartó

Webes munkanyilvántartó **építészeti ügyintézéshez** és **épületenergetikai munkákhoz**.
Google Apps Script webalkalmazás, az adatok egy **Google Sheet**-ben tárolódnak –
saját szerver, hoszting és havidíj nélkül, bármely eszközről elérhető a Google-fiókoddal.

## Mit tud?

- **Két fül (bővíthető):** 📐 Építészeti munkák · ⚡ Épületenergetika
- Projektenként látod: **jelenlegi állapot**, cél, határidő, prioritás, szakág bevonása,
  megrendelő + elérhetőség, vállalt díj, fizetés státusza, **mit mondtál a megrendelőnek**,
  következő teendő, és még sok minden.
- **Keresés** (név, megrendelő, cím, HRSZ), **állapotszűrő**, lezártak elrejtése.
- **Összesítő sáv:** összes / nyitott munka, rendezetlen fizetések, **kintlévőség (Ft)**.
- Színes jelzések: állapot, fizetés, **lejárt / közeli határidő**.
- Az adat a Google Sheet-ben van – ott is bele tudsz nyúlni, menthető, exportálható.

### Mezők

**📐 Építészet:** munkanem (hatósági bizonyítvány, fennmaradási engedély, építési engedély,
egyszerű bejelentés, építészeti rajzolás, tartószerkezeti rajzolás), állapot, cél, határidő,
prioritás, szakág kell-e + mely szakág (gépész/elektromos/statikus/földmérő), ingatlan címe,
HRSZ, ÉTDR/ügyiratszám, megrendelő + elérhetőség, vállalt díj, fizetés státusza, fizetett összeg,
számlázva, utolsó egyeztetés, mit mondtál a megrendelőnek, következő teendő, dokumentumok linkje, megjegyzés.

**⚡ Energetika:** munkanem (HET, energetikai számítás, pályázat), melyik pályázat,
kell-e nyilatkozat, állapot, határidő, prioritás, cím, HRSZ, megrendelő + elérhetőség,
vállalt díj, fizetés státusza, fizetett összeg, utolsó egyeztetés, mit mondtál a megrendelőnek,
következő teendő, dokumentumok linkje, megjegyzés.

---

## Telepítés – „A" mód (kattintós, ajánlott, ~5 perc)

Nem kell semmit telepíteni a gépedre.

1. Menj a **[sheets.new](https://sheets.new)** címre → létrejön egy üres Google Táblázat.
   Nevezd át pl. „Munkanyilvántartó"-ra.
2. A táblázatban: **Bővítmények → Apps Script** (Extensions → Apps Script).
   Megnyílik a kódszerkesztő.
3. **Másold be a fájlokat** ebből a repóból (a `+` gombbal hozz létre új fájlt, a megadott típussal):
   | Apps Script fájl neve | Típus | Tartalom innen |
   |---|---|---|
   | `Code.gs` | Script | `Code.gs` |
   | `Index.html` | HTML | `Index.html` |
   | `Stylesheet.html` | HTML | `Stylesheet.html` |
   | `JavaScript.html` | HTML | `JavaScript.html` |
   | `appsscript.json` (Projekt beállítások → „appsscript.json megjelenítése") | – | `appsscript.json` |

   > A meglévő `Code.gs` tartalmát írd felül a repóbeli `Code.gs` tartalmával.
   > Az alapból létező `Index.html` stb. nincs – ezeket a `+ → HTML` gombbal hozod létre, a `.html` végződést a szerkesztő magától kezeli.
4. **Mentés** (💾). Majd futtasd le egyszer a `setup` függvényt
   (a függvény-legördülőből válaszd a `setup`-ot → ▶ Futtatás).
   Első futáskor a Google **engedélyt kér** – fogadd el (a saját fiókodban fut, a saját táblázatodon).
   → Létrejön a két munkalap: „Építészet" és „Energetika".
5. **Közzététel webalkalmazásként:** jobbra fönt **Telepítés → Új telepítés**
   (Deploy → New deployment) → fogaskerék → **Webalkalmazás**.
   - „Futtatás mint": **Én** (a saját fiókod)
   - „Ki férhet hozzá": **Csak én** (ajánlott – csak te éred el)
   - **Telepítés**.
6. Megkapod a **webalkalmazás URL-jét**. Ezt nyisd meg böngészőből (gépen/telefonon),
   és tedd ki a kezdőképernyőre/könyvjelzőbe. **Kész!** 🎉

> Frissítéskor (ha módosul a kód): Telepítés → Telepítések kezelése → ceruza → „Új verzió" → Telepítés.

---

## Telepítés – „B" mód (fejlesztőknek, `clasp`-pal)

```bash
npm install -g @google/clasp
clasp login
clasp create --type sheets --title "Munkanyilvántartó"   # létrehoz egy táblázatot + script projektet
cp .clasp.json.example .clasp.json                        # majd írd bele a kapott scriptId-t (vagy a create maga létrehozza)
clasp push                                                 # feltölti a repó fájljait
clasp deploy --description "v1"                            # webalkalmazás telepítés
```

Ezután a Google felületén futtasd egyszer a `setup` függvényt és add meg az engedélyt,
majd nyisd meg a webalkalmazás URL-jét.

---

## Bővítés (új fül vagy mező)

Minden a `Code.gs` tetején lévő **`CONFIG`** objektumból jön – a táblázat oszlopai és a
webes űrlap is ehhez igazodnak automatikusan.

- **Új mező:** vegyél fel egy elemet a megfelelő kategória `fields` tömbjébe, pl.:
  ```js
  { key: 'tervezo', label: 'Felelős tervező', type: 'text' }
  ```
  Mezőtípusok: `text`, `textarea`, `number`, `date`, `select` (+`options`),
  `multiselect` (+`options`), `bool`. A `list: true` azt jelzi, hogy a kártyán/keresésben kiemelt.
- **Új munkanem:** bővítsd az adott `munkanem` mező `options` listáját.
- **Új fül (kategória):** adj hozzá egy új blokkot a `categories` tömbhöz (saját `key`, `sheet`, `fields`).

Mentés után a táblázatban futtasd újra a `setup`-ot (vagy nyisd meg az appot – a hiányzó
oszlopokat magától pótolja), majd telepíts új verziót.

> Régi adat nem vész el: a `setup`/megnyitás csak **hozzáadja** a hiányzó oszlopokat, nem töröl.

---

## Adat és biztonság

- Minden adat a **te Google Sheet-edben** van, a te fiókodban. Másnak nincs hozzáférése
  (a „Csak én" beállítás miatt).
- A rekordoknak rejtett `__id`, `__letrehozva`, `__modositva` szolgáltatás-oszlopaik vannak –
  ezeket ne töröld kézzel a táblázatban.
- Biztonsági mentés: a Google Sheet-et bármikor letöltheted (Fájl → Letöltés → Excel/CSV).

## Később hozzáadható (előkészítve)

- Határidő → **Google Naptár** bejegyzés
- Közeli határidő / fizetetlen díj → **e-mail emlékeztető**

Szólj, ha ezeket bekapcsoljuk.
