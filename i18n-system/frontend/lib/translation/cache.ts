// ─── Server-side Translation Cache ─────────────────────────────────────────
// In-memory LRU-style cache for Google Translate results.
// In production replace with Redis (see commented code at the bottom).

type Entry = { value: string; expiresAt: number };

class TranslationCache {
  private store  = new Map<string, Entry>();
  private maxSize: number;
  private ttlMs:   number;

  constructor(maxSize = 5_000, ttlHours = 24) {
    this.maxSize = maxSize;
    this.ttlMs   = ttlHours * 60 * 60 * 1000;
  }

  /** Build a deterministic cache key. */
  key(text: string, from: string, to: string): string {
    // Hash long texts to keep key size manageable
    const textKey = text.length > 80 ? text.slice(0, 80) + text.length : text;
    return `${from}→${to}:${textKey}`;
  }

  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: string): void {
    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  stats() {
    return { size: this.store.size, maxSize: this.maxSize };
  }
}

// Module-level singleton (survives across Next.js hot-reloads in dev via globalThis)
declare global {
  // eslint-disable-next-line no-var
  var __translationCache: TranslationCache | undefined;
}

export const translationCache: TranslationCache =
  globalThis.__translationCache ?? (globalThis.__translationCache = new TranslationCache());

// ─── Client-side cache (per-tab, in-memory Map) ────────────────────────────
// Used by useDynamicTranslation hook to avoid redundant fetch calls.
export const clientTranslationCache = new Map<string, string>();

/* ──────────────────────────────────────────────────────────────────────────
 * Redis drop-in (uncomment when adding Redis to production):
 *
 * import { createClient } from 'redis';
 * const redis = createClient({ url: process.env.REDIS_URL });
 * redis.connect();
 *
 * export async function redisGet(key: string) {
 *   return redis.get(key);
 * }
 * export async function redisSet(key: string, value: string, ttlSec = 86400) {
 *   return redis.setEx(key, ttlSec, value);
 * }
 * ────────────────────────────────────────────────────────────────────────── */
