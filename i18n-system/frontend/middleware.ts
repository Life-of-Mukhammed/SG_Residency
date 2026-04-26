// ─── Next.js Middleware — Locale Routing ───────────────────────────────────
// Intercepts every non-asset request and redirects to the correct locale
// prefix (/en, /ru, /uz).
//
// Detection priority:
//   1. NEXT_LOCALE cookie (set by LanguageSwitcher)
//   2. Accept-Language header (browser preference)
//   3. DEFAULT_LOCALE fallback

import { NextRequest, NextResponse } from 'next/server';
import Negotiator      from 'negotiator';
import { match }       from '@formatjs/intl-localematcher';
import { LOCALES, DEFAULT_LOCALE, isValidLocale } from '@/lib/i18n/config';

function detectLocale(req: NextRequest): string {
  // 1. Cookie set by language switcher
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && isValidLocale(cookie)) return cookie;

  // 2. Accept-Language negotiation
  try {
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });
    const languages = new Negotiator({ headers }).languages();
    return match(languages, [...LOCALES], DEFAULT_LOCALE);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip if already prefixed with a valid locale
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  // Determine locale and redirect
  const locale  = detectLocale(req);
  const url      = req.nextUrl.clone();
  url.pathname   = `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);

  // Persist the detected locale for subsequent SSR requests
  response.cookies.set('NEXT_LOCALE', locale, {
    path:     '/',
    maxAge:   60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
