/**
 * Adatréteg – egységes API két háttérrel:
 *   - LocalStore : localStorage (alapértelmezett, demo/offline, mintaadattal)
 *   - CloudStore : Supabase (több eszközös szinkron, bejelentkezés után)
 *
 * Közös felület mindkettőn:
 *   list(categoryKey)         -> Promise<record[]>
 *   save(categoryKey, record) -> Promise<id>
 *   remove(categoryKey, id)   -> Promise<void>
 *
 * A `record` lapos objektum: { id, created_at, updated_at, ...mezők }.
 * Felhőben a mezők a `works.data` JSONB oszlopban élnek; a store oda-vissza
 * fordít, így a felület mindkét módban ugyanúgy dolgozik.
 */

import { CONFIG } from './schema.js';
import { SAMPLE_DATA } from './sampleData.js';
import { getClient } from './supabaseClient.js';

const LS_KEY = 'mnyt.data';
const SEED_FLAG = 'mnyt.seeded';
const META = ['id', 'created_at', 'updated_at'];

const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));

/** A mezőket leválasztja a meta-adatokról (felhő `data` oszlophoz) */
function toData(record) {
  const data = {};
  const cat = CONFIG.categories.find(c => record.__cat === c.key) || null;
  Object.keys(record).forEach(k => {
    if (META.includes(k) || k === '__cat') return;
    data[k] = record[k];
  });
  return data;
}

/* --------------------------- LocalStore --------------------------- */

class LocalStore {
  constructor() { this.mode = 'local'; this._ensureSeed(); }

  _read() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch { return {}; }
  }
  _write(all) { localStorage.setItem(LS_KEY, JSON.stringify(all)); }

  _ensureSeed() {
    if (localStorage.getItem(SEED_FLAG)) return;
    const all = this._read();
    CONFIG.categories.forEach(cat => {
      if (all[cat.key] && all[cat.key].length) return;
      const now = new Date().toISOString();
      all[cat.key] = (SAMPLE_DATA[cat.key] || []).map(rec => ({
        id: uid(), created_at: now, updated_at: now, ...rec
      }));
    });
    this._write(all);
    localStorage.setItem(SEED_FLAG, '1');
  }

  async list(categoryKey) {
    const all = this._read();
    return (all[categoryKey] || []).slice();
  }

  async save(categoryKey, record) {
    const all = this._read();
    const arr = all[categoryKey] || (all[categoryKey] = []);
    const now = new Date().toISOString();
    if (record.id) {
      const i = arr.findIndex(r => r.id === record.id);
      if (i === -1) throw new Error('A rekord nem található.');
      arr[i] = { ...arr[i], ...record, updated_at: now };
      this._write(all);
      return record.id;
    }
    const id = uid();
    const clean = { ...record }; delete clean.__cat;
    arr.push({ id, created_at: now, updated_at: now, ...clean });
    this._write(all);
    return id;
  }

  async remove(categoryKey, id) {
    const all = this._read();
    all[categoryKey] = (all[categoryKey] || []).filter(r => r.id !== id);
    this._write(all);
  }

  /** Minden helyi munka (migrációhoz) */
  async exportAll() {
    const all = this._read();
    const out = {};
    CONFIG.categories.forEach(c => out[c.key] = (all[c.key] || []).slice());
    return out;
  }

  /** Minta + adatok teljes törlése */
  clearAll() {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(SEED_FLAG);
  }
}

/* --------------------------- CloudStore --------------------------- */

class CloudStore {
  constructor() { this.mode = 'cloud'; }

  _rowToRecord(row) {
    return { id: row.id, created_at: row.created_at, updated_at: row.updated_at, ...(row.data || {}) };
  }

  async list(categoryKey) {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from('works')
      .select('id, category, data, created_at, updated_at')
      .eq('category', categoryKey)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => this._rowToRecord(r));
  }

  async save(categoryKey, record) {
    const supabase = await getClient();
    const data = toData({ ...record, __cat: categoryKey });
    if (record.id) {
      const { error } = await supabase
        .from('works')
        .update({ data, updated_at: new Date().toISOString() })
        .eq('id', record.id);
      if (error) throw error;
      return record.id;
    }
    const { data: inserted, error } = await supabase
      .from('works')
      .insert({ category: categoryKey, data })
      .select('id')
      .single();
    if (error) throw error;
    return inserted.id;
  }

  async remove(categoryKey, id) {
    const supabase = await getClient();
    const { error } = await supabase.from('works').delete().eq('id', id);
    if (error) throw error;
  }

  /** Helyi adatok feltöltése a felhőbe (migráció) */
  async importAll(byCategory) {
    const supabase = await getClient();
    const rows = [];
    Object.keys(byCategory).forEach(catKey => {
      (byCategory[catKey] || []).forEach(rec => {
        const data = toData({ ...rec, __cat: catKey });
        rows.push({ category: catKey, data });
      });
    });
    if (!rows.length) return 0;
    const { error } = await supabase.from('works').insert(rows);
    if (error) throw error;
    return rows.length;
  }
}

/* --------------------------- gyárak --------------------------- */

export const localStore = new LocalStore();
export const cloudStore = new CloudStore();

/** A megadott mód szerinti store */
export function storeFor(mode) {
  return mode === 'cloud' ? cloudStore : localStore;
}
