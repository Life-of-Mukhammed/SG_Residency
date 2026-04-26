// ─── Google Cloud Translation service (Express backend) ────────────────────
import { translationCache }                from './cache';
import { GOOGLE_LANG_CODES, type Locale, type TranslateResult } from '../types';

const API_KEY  = process.env.GOOGLE_TRANSLATE_API_KEY;
const BASE_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Translate one or many strings.
 * Batch-calls Google API; per-string results are cached independently.
 */
export async function translateTexts(
  texts:  string[],
  from:   string,
  to:     Locale
): Promise<TranslateResult[]> {
  const targetCode = GOOGLE_LANG_CODES[to];

  // Same source and target — return as-is
  if (from === to) {
    return texts.map((t) => ({ translatedText: t, fromCache: true }));
  }

  const results: TranslateResult[]  = new Array(texts.length);
  const uncachedIdx:   number[] = [];
  const uncachedTexts: string[] = [];

  // ── Cache check ───────────────────────────────────────────────────────────
  texts.forEach((text, i) => {
    const hit = translationCache.get(translationCache.key(text, from, to));
    if (hit !== null) {
      results[i] = { translatedText: hit, fromCache: true };
    } else {
      uncachedIdx.push(i);
      uncachedTexts.push(text);
    }
  });

  if (uncachedTexts.length === 0) return results;

  // ── No API key — warn and return originals ────────────────────────────────
  if (!API_KEY) {
    console.warn('[i18n-backend] GOOGLE_TRANSLATE_API_KEY not set');
    uncachedIdx.forEach((idx, j) => {
      results[idx] = { translatedText: uncachedTexts[j], fromCache: false };
    });
    return results;
  }

  // ── Google API call ───────────────────────────────────────────────────────
  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      q:       uncachedTexts,
      source:  from,
      target:  targetCode,
      format:  'text',
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      `Google Translate ${response.status}: ${(errBody as any)?.error?.message ?? 'unknown'}`
    );
  }

  const data = await response.json();
  const raw: Array<{ translatedText: string; detectedSourceLanguage?: string }> =
    data.data.translations;

  uncachedIdx.forEach((idx, j) => {
    const translated = raw[j].translatedText;
    results[idx] = {
      translatedText:    translated,
      detectedLanguage:  raw[j].detectedSourceLanguage,
      fromCache:         false,
    };
    translationCache.set(
      translationCache.key(uncachedTexts[j], from, to),
      translated
    );
  });

  return results;
}

/** Detect the language of a text string. */
export async function detectLanguage(text: string): Promise<string> {
  if (!API_KEY) return 'en';

  const response = await fetch(`${BASE_URL}/detect?key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ q: text }),
  });

  if (!response.ok) throw new Error('Language detection API failed');
  const data = await response.json();
  return data.data.detections?.[0]?.[0]?.language ?? 'en';
}
