/**
 * Minta munkák – csak helyi (demo) módban töltődnek be első indításkor,
 * hogy rögtön látsszon a felület működése. Bármikor törölhetők a felületről,
 * vagy a Beállítások panelről egy gombbal.
 *
 * A dátumok dinamikusan a mai naphoz képest készülnek, hogy a "lejárt" és
 * "közeli határidő" jelzések is látszódjanak.
 */

function plusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const SAMPLE_DATA = {
  epiteszet: [
    {
      nev: 'Családi ház bővítés – Kovács',
      munkanem: 'Építési engedély',
      allapot: 'Hatóságnál / beadva',
      cel: 'Tetőtér-beépítés és földszinti bővítés engedélyeztetése.',
      hatarido: plusDays(14),
      prioritas: 'Magas',
      szakag_kell: 'Igen',
      szakagak: 'Statikus; Gépész',
      cim: '2030 Érd, Tárnoki út 12.',
      hrsz: '1234/5',
      etdr: 'ÉTDR-2026-000123',
      megrendelo: 'Kovács Péter',
      megrendelo_elerhetoseg: '+36 20 123 4567',
      vallalt_dij: 450000,
      fizetes_statusz: 'Részben fizetett',
      fizetett_osszeg: 200000,
      szamlazva: 'Kiállítva',
      utolso_egyeztetes: plusDays(-3),
      megrendelonek_mondva: 'Beadtuk a kérelmet, a hatósági átfutás kb. 3 hét.',
      kovetkezo_teendo: 'Hiánypótlásra figyelni, statikai munkarész egyeztetése.',
      megjegyzes: ''
    },
    {
      nev: 'Garázs fennmaradás – Nagy',
      munkanem: 'Fennmaradási engedély',
      allapot: 'Hiánypótlás',
      cel: 'Engedély nélkül épült garázs utólagos fennmaradási engedélye.',
      hatarido: plusDays(-2),
      prioritas: 'Sürgős',
      szakag_kell: 'Nem',
      szakagak: '',
      cim: '2040 Budaörs, Szabadság út 5.',
      hrsz: '987/1',
      etdr: 'ÉTDR-2026-000098',
      megrendelo: 'Nagy Ilona',
      megrendelo_elerhetoseg: 'nagy.ilona@example.com',
      vallalt_dij: 280000,
      fizetes_statusz: 'Nem fizetett',
      fizetett_osszeg: 0,
      szamlazva: 'Nincs',
      utolso_egyeztetes: plusDays(-5),
      megrendelonek_mondva: 'A hatóság hiánypótlást kért, a határidő szoros.',
      kovetkezo_teendo: 'Hiánypótlási dokumentáció pótlása, ügyfél értesítése.',
      megjegyzes: 'Lejárt határidő – sürgős!'
    },
    {
      nev: 'Társasház homlokzat – hatósági biz.',
      munkanem: 'Hatósági bizonyítvány',
      allapot: 'Adatgyűjtés',
      cel: 'Meglévő állapot igazolása hatósági bizonyítvánnyal.',
      hatarido: plusDays(30),
      prioritas: 'Közepes',
      szakag_kell: 'Nem',
      szakagak: '',
      cim: '1114 Budapest, Bartók Béla út 40.',
      hrsz: '4567',
      etdr: '',
      megrendelo: 'Társasház Közös Képviselet',
      megrendelo_elerhetoseg: '+36 1 234 5678',
      vallalt_dij: 180000,
      fizetes_statusz: 'Kifizetve',
      fizetett_osszeg: 180000,
      szamlazva: 'Kifizetve',
      utolso_egyeztetes: plusDays(-1),
      megrendelonek_mondva: 'Helyszíni felmérés a jövő héten, utána összeállítjuk az anyagot.',
      kovetkezo_teendo: 'Helyszíni felmérés időpont egyeztetése.',
      megjegyzes: ''
    }
  ],
  energetika: [
    {
      nev: 'Napelem pályázat – Tóth ház',
      munkanem: 'Pályázat',
      palyazat_neve: 'Otthonfelújítási / energetikai pályázat',
      nyilatkozat_kell: 'Igen',
      allapot: 'Számítás folyamatban',
      hatarido: plusDays(7),
      prioritas: 'Magas',
      cim: '2100 Gödöllő, Kossuth Lajos u. 3.',
      hrsz: '321/2',
      megrendelo: 'Tóth Gábor',
      megrendelo_elerhetoseg: '+36 30 987 6543',
      vallalt_dij: 120000,
      fizetes_statusz: 'Nem fizetett',
      fizetett_osszeg: 0,
      utolso_egyeztetes: plusDays(-2),
      megrendelonek_mondva: 'A számítás a héten elkészül, utána jön a nyilatkozat.',
      kovetkezo_teendo: 'Energetikai számítás véglegesítése, nyilatkozat kiállítása.',
      megjegyzes: ''
    },
    {
      nev: 'Lakás energetikai tanúsítvány (HET)',
      munkanem: 'HET',
      palyazat_neve: '',
      nyilatkozat_kell: 'Nem',
      allapot: 'Kész',
      hatarido: plusDays(3),
      prioritas: 'Közepes',
      cim: '1052 Budapest, Váci utca 8.',
      hrsz: '24680',
      megrendelo: 'Szabó Anna',
      megrendelo_elerhetoseg: 'szabo.anna@example.com',
      vallalt_dij: 35000,
      fizetes_statusz: 'Kifizetve',
      fizetett_osszeg: 35000,
      utolso_egyeztetes: plusDays(-4),
      megrendelonek_mondva: 'A tanúsítvány elkészült, e-mailben küldöm a HET-azonosítót.',
      kovetkezo_teendo: 'Tanúsítvány megküldése, lezárás.',
      megjegyzes: ''
    }
  ]
};
