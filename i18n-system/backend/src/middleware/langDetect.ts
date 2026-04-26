// ─── Language detection middleware ──────────────────────────────────────────
// Parses Accept-Language header and attaches the best-match locale to req.

import { Request, Response, NextFunction } from 'express';
import { LOCALES, isValidLocale, type Locale } from '../types';

declare global {
  namespace Express {
    interface Request {
      detectedLocale: Locale;
    }
  }
}

const DEFAULT: Locale = 'en';

function parseAcceptLanguage(header: string | undefined): string[] {
  if (!header) return [];
  return header
    .split(',')
    .map((s) => {
      const [lang, q = '1'] = s.trim().split(';q=');
      return { lang: lang.trim().split('-')[0].toLowerCase(), q: parseFloat(q) };
    })
    .sort((a, b) => b.q - a.q)
    .map((x) => x.lang);
}

export function langDetect(req: Request, _res: Response, next: NextFunction) {
  // 1. Query param  ?lang=ru
  const query = req.query.lang;
  if (typeof query === 'string' && isValidLocale(query)) {
    req.detectedLocale = query;
    return next();
  }

  // 2. X-Locale header (useful for native apps)
  const header = req.headers['x-locale'];
  if (typeof header === 'string' && isValidLocale(header)) {
    req.detectedLocale = header;
    return next();
  }

  // 3. Accept-Language negotiation
  const preferred = parseAcceptLanguage(req.headers['accept-language']);
  req.detectedLocale = (preferred.find((l) => isValidLocale(l)) as Locale) ?? DEFAULT;

  next();
}
