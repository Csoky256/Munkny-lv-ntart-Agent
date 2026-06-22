/**
 * Supabase kliens – a felhő (több eszközös szinkron) mód háttere.
 *
 * A kapcsolati adatok (projekt URL + anon kulcs) NEM a repóban vannak, hanem a
 * felhasználó a Beállítások panelen adja meg őket; localStorage-ban tárolódnak.
 * Az anon kulcs designból publikus – a biztonságot a Supabase Auth + Row Level
 * Security adja (mindenki csak a saját rekordjait éri el).
 */

const CFG_KEY = 'mnyt.supabase.config';
const CDN = 'https://esm.sh/@supabase/supabase-js@2';

let clientPromise = null;

/** A mentett Supabase-konfiguráció (URL + anon kulcs), vagy null */
export function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** URL normalizálása: szóközök és a végén lévő perjel(ek) levágása (dupla // elkerülése) */
function normalizeUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

/** Konfiguráció mentése / törlése (null törli) */
export function setSupabaseConfig(cfg) {
  if (cfg && cfg.url && cfg.anonKey) {
    localStorage.setItem(CFG_KEY, JSON.stringify({ url: normalizeUrl(cfg.url), anonKey: cfg.anonKey.trim() }));
  } else {
    localStorage.removeItem(CFG_KEY);
  }
  clientPromise = null; // újra kell építeni a klienst
}

export function isConfigured() {
  return !!getSupabaseConfig();
}

/**
 * Supabase kliens lekérése (lustán, a CDN-ről importálva).
 * Hibát dob, ha nincs konfiguráció.
 */
export async function getClient() {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Nincs megadva Supabase kapcsolat.');
  if (!clientPromise) {
    const url = normalizeUrl(cfg.url);
    clientPromise = import(CDN).then(({ createClient }) =>
      createClient(url, cfg.anonKey.trim(), {
        auth: { persistSession: true, autoRefreshToken: true }
      })
    );
  }
  return clientPromise;
}
