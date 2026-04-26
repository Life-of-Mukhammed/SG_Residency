// ─── Translation Cache (node-cache) ────────────────────────────────────────
// node-cache is an in-process LRU cache with TTL support.
// In a multi-instance deployment, swap this for Redis.

import NodeCache from 'node-cache';

const TTL_SECONDS = 60 * 60 * 24; // 24 hours
const MAX_KEYS    = 10_000;

const store = new NodeCache({
  stdTTL:      TTL_SECONDS,
  maxKeys:     MAX_KEYS,
  checkperiod: 600,          // prune expired keys every 10 min
  useClones:   false,
});

export const translationCache = {
  /** Build a deterministic key for a (text, from, to) triple. */
  key(text: string, from: string, to: string): string {
    const textKey = text.length > 100 ? text.slice(0, 100) + text.length : text;
    return `${from}→${to}:${textKey}`;
  },

  get(key: string): string | null {
    return store.get<string>(key) ?? null;
  },

  set(key: string, value: string): void {
    store.set(key, value);
  },

  stats() {
    return store.getStats();
  },
};
