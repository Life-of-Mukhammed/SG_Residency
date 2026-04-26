// ─── Simple in-memory rate limiter ─────────────────────────────────────────
// Limits translate API calls to `max` requests per `windowMs` per identifier.
// For production use `@upstash/ratelimit` with Redis instead.

type Record = { count: number; resetAt: number };

class RateLimiter {
  private store    = new Map<string, Record>();
  private max:      number;
  private windowMs: number;

  constructor(max = 60, windowMs = 60_000) {
    this.max      = max;
    this.windowMs = windowMs;
  }

  check(id: string): { success: boolean; remaining: number; resetIn: number } {
    const now  = Date.now();
    let entry  = this.store.get(id);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(id, entry);
    }

    entry.count++;

    const remaining = Math.max(0, this.max - entry.count);
    const resetIn   = entry.resetAt - now;
    const success   = entry.count <= this.max;

    return { success, remaining, resetIn };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __rateLimiter: RateLimiter | undefined;
}

export const rateLimiter: RateLimiter =
  globalThis.__rateLimiter ?? (globalThis.__rateLimiter = new RateLimiter(60, 60_000));
