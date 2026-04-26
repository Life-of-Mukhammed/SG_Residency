// ─── Google Cloud Translation API (server-side only) ───────────────────────
// Never import this file from client components — the API key would leak.
// All client requests must go through /api/translate.

import { translationCache } from './cache';
import { GOOGLE_LANG_CODES, type Locale } from '@/lib/i18n/config';

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const BASE_URL = 'https://translation.googleapis.com/language/translate/v2';

export type TranslateInput = {
  text: string | string[];
  from:  string;   // source language code
  to:    Locale;   // target locale
};

export type TranslateOutput = {
  translatedText:     string;
  detectedLanguage?:  string;
  fromCache:          boolean;
};

/**
 * Translate one or many strings via Google Cloud Translation API.
 * Results are cached server-side (in-memory, 24 h TTL).
 *
 * @example
 *   const [res] = await translateText({ text: 'Hello', from: 'en', to: 'ru' });
 *   console.log(res.translatedText); // "Привет"
 */
export async function translateText(input: TranslateInput): Promise<TranslateOutput[]> {
  const texts = Array.isArray(input.text) ? input.text : [input.text];
  const targetCode = GOOGLE_LANG_CODES[input.to];

  if (input.from === input.to) {
    return texts.map((t) => ({ translatedText: t, fromCache: true }));
  }

  // ── Split into cached / uncached ─────────────────────────────────────────
  const results: TranslateOutput[] = new Array(texts.length);
  const uncachedIdx:   number[] = [];
  const uncachedTexts: string[] = [];

  texts.forEach((text, i) => {
    const cKey = translationCache.key(text, input.from, input.to);
    const hit  = translationCache.get(cKey);
    if (hit !== null) {
      results[i] = { translatedText: hit, fromCache: true };
    } else {
      uncachedIdx.push(i);
      uncachedTexts.push(text);
    }
  });

  if (uncachedTexts.length === 0) return results;

  // ── API not configured — return originals with a warning ─────────────────
  if (!API_KEY) {
    console.warn(
      '[i18n] GOOGLE_TRANSLATE_API_KEY is not set. ' +
      'Dynamic translation will return the original text.'
    );
    uncachedIdx.forEach((idx, j) => {
      results[idx] = { translatedText: uncachedTexts[j], fromCache: false };
    });
    return results;
  }

  // ── Call the API ──────────────────────────────────────────────────────────
  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q:       uncachedTexts,
      source:  input.from,
      target:  targetCode,
      format:  'text',
    }),
    // Next.js fetch cache — reuse the same response within a single render
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Google Translate API ${response.status}: ${err?.error?.message ?? 'unknown error'}`
    );
  }

  const data = await response.json();
  const translations: Array<{ translatedText: string; detectedSourceLanguage?: string }> =
    data.data.translations;

  // ── Store results in cache ────────────────────────────────────────────────
  uncachedIdx.forEach((idx, j) => {
    const translated = translations[j].translatedText;
    results[idx] = {
      translatedText:    translated,
      detectedLanguage:  translations[j].detectedSourceLanguage,
      fromCache:         false,
    };
    translationCache.set(
      translationCache.key(uncachedTexts[j], input.from, input.to),
      translated
    );
  });

  return results;
}

/**
 * Detect the language of a text string.
 * Returns a BCP-47 language tag e.g. "en", "ru", "uz".
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!API_KEY) return 'en';

  const response = await fetch(
    `${BASE_URL}/detect?key=${API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ q: text }),
    }
  );

  if (!response.ok) throw new Error('Language detection failed');
  const data = await response.json();
  return data.data.detections[0]?.[0]?.language ?? 'en';
}
