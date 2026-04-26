// ─── POST /api/translate ────────────────────────────────────────────────────
// Proxy endpoint that:
//   • Validates the request
//   • Enforces per-IP rate limiting
//   • Calls Google Translate (with server-side caching)
//   • Returns translated text(s)
//
// Body: { text: string | string[], from: string, to: Locale }
// Response: { translations: TranslateOutput[], cached: boolean }

import { NextRequest, NextResponse } from 'next/server';
import { translateText }   from '@/lib/translation/googleTranslate';
import { rateLimiter }     from '@/lib/translation/rateLimit';
import { isValidLocale }   from '@/lib/i18n/config';

export async function POST(req: NextRequest) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, remaining, resetIn } = rateLimiter.check(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After':               String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Remaining':     '0',
        },
      }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { text?: unknown; from?: unknown; to?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, from = 'en', to } = body;

  if (!text) {
    return NextResponse.json({ error: '"text" is required' }, { status: 400 });
  }
  if (!to || !isValidLocale(to)) {
    return NextResponse.json(
      { error: `"to" must be one of: en, ru, uz` },
      { status: 400 }
    );
  }

  const textArray = Array.isArray(text) ? text : [text];
  if (textArray.some((t) => typeof t !== 'string')) {
    return NextResponse.json({ error: '"text" must be string or string[]' }, { status: 400 });
  }
  if (textArray.length > 128) {
    return NextResponse.json({ error: 'Max 128 strings per request' }, { status: 400 });
  }

  // ── Translate ─────────────────────────────────────────────────────────────
  try {
    const translations = await translateText({
      text: textArray as string[],
      from: String(from),
      to,
    });

    return NextResponse.json(
      { translations },
      {
        headers: {
          'X-RateLimit-Remaining': String(remaining),
          'Cache-Control':         'private, max-age=3600',
        },
      }
    );
  } catch (err: any) {
    console.error('[/api/translate]', err?.message);
    return NextResponse.json({ error: 'Translation service error' }, { status: 502 });
  }
}

// ── GET /api/translate/detect ─────────────────────────────────────────────
// Query: ?text=Hello+world
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text');
  if (!text) {
    return NextResponse.json({ error: '"text" query param is required' }, { status: 400 });
  }

  const { detectLanguage } = await import('@/lib/translation/googleTranslate');
  try {
    const lang = await detectLanguage(text);
    return NextResponse.json({ language: lang });
  } catch {
    return NextResponse.json({ error: 'Detection failed' }, { status: 502 });
  }
}
