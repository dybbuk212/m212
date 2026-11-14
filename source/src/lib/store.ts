import { useSyncExternalStore } from "react";
import { createSeed, type Db } from "@/data/seed";

/** Centralised local demo data layer. All persistence goes through this module. */
export const DB_KEY = "m212.db.v2";
type Listener = () => void;
type ArrayKeys = { [K in keyof Db]: Db[K] extends Array<{ id: string }> ? K : never }[keyof Db];
type Item<K extends ArrayKeys> = Db[K] extends Array<infer T> ? T : never;

const listeners = new Set<Listener>();
let state: Db = load();

function storage(): Storage | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}

function load(): Db {
  const raw = storage()?.getItem(DB_KEY);
  if (!raw) return createSeed();
  try {
    const parsed = JSON.parse(raw) as Partial<Db>;
    return { ...createSeed(), ...parsed };
  } catch {
    return createSeed();
  }
}

function persist() {
  try { storage()?.setItem(DB_KEY, JSON.stringify(state)); } catch (error) { console.warn("Demo data could not be saved", error); }
  listeners.forEach((l) => l());
}

export const db = {
  get: () => state,
  subscribe(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  set(next: Db) { state = next; persist(); },
  update(fn: (draft: Db) => Db) { state = fn(state); persist(); },
  insert<K extends ArrayKeys>(key: K, item: Item<K>) {
    state = { ...state, [key]: [item, ...(state[key] as Item<K>[])] } as Db; persist(); return item;
  },
  patch<K extends ArrayKeys>(key: K, id: string, changes: Partial<Item<K>>) {
    state = { ...state, [key]: (state[key] as unknown as Array<Item<K> & { id: string }>).map((x) => (x.id === id ? { ...x, ...changes } : x)) } as Db; persist();
  },
  remove<K extends ArrayKeys>(key: K, id: string) {
    state = { ...state, [key]: (state[key] as Array<{ id: string }>).filter((x) => x.id !== id) } as Db; persist();
  },
  find<K extends ArrayKeys>(key: K, id: string): Item<K> | undefined {
    return (state[key] as unknown as Array<Item<K> & { id: string }>).find((x) => x.id === id);
  },
  log(actor: string, action: string, target: string) {
    state = { ...state, activity: [{ id: uid("act"), at: new Date().toISOString(), actor, action, target }, ...state.activity].slice(0, 300) }; persist();
  },
  reset() { state = createSeed(); persist(); },
  exportJson() { return JSON.stringify({ format: "m212-demo-data", version: 2, exportedAt: new Date().toISOString(), data: state }, null, 2); },
  importJson(text: string) {
    const parsed = JSON.parse(text) as { format?: string; data?: Partial<Db> };
    if (parsed.format !== "m212-demo-data" || !parsed.data || !Array.isArray(parsed.data.products)) throw new Error("This file is not an M212 demo data export.");
    state = { ...createSeed(), ...parsed.data }; persist();
  },
};

export function useDb(): Db {
  return useSyncExternalStore(db.subscribe, db.get, db.get);
}

let counter = 0;
export function uid(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Small persisted value store for UI preferences (locale, currency, cart, session). */
export function createPersisted<T>(key: string, initial: T) {
  const subs = new Set<Listener>();
  let value: T = initial;
  const raw = storage()?.getItem(key);
  if (raw) { try { value = JSON.parse(raw) as T; } catch { /* keep initial */ } }
  return {
    get: () => value,
    set(next: T) { value = next; try { storage()?.setItem(key, JSON.stringify(next)); } catch { /* ignore */ } subs.forEach((l) => l()); },
    subscribe(l: Listener) { subs.add(l); return () => { subs.delete(l); }; },
    use(): T { return useSyncExternalStore(this.subscribe, this.get, this.get); },
  };
}
