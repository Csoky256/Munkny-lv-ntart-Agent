/**
 * Hitelesítés (Supabase Auth, e-mail + jelszó).
 * Csak felhő módban használt. A munkamenet a böngészőben perzisztálódik,
 * így legközelebb nem kell újra belépni ugyanazon az eszközön.
 */

import { getClient } from './supabaseClient.js';

/** Aktuális bejelentkezett felhasználó, vagy null */
export async function getUser() {
  try {
    const supabase = await getClient();
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  } catch {
    return null;
  }
}

/** Bejelentkezés e-mail + jelszóval */
export async function signIn(email, password) {
  const supabase = await getClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

/** Regisztráció e-mail + jelszóval */
export async function signUp(email, password) {
  const supabase = await getClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/** Kijelentkezés */
export async function signOut() {
  const supabase = await getClient();
  await supabase.auth.signOut();
}

/** Értesítés a bejelentkezési állapot változásáról */
export async function onAuthChange(callback) {
  const supabase = await getClient();
  supabase.auth.onAuthStateChange((_event, session) => callback(session ? session.user : null));
}
