'use client';
// ─── useDynamicTranslation hook ────────────────────────────────────────────
// Translates arbitrary strings (from API / DB) via the /api/translate route.
// Results are cached client-side (Map) to avoid redundant network calls.

import { useCallback, useRef, useState } from 'react';
import { clientTranslationCache }        from '@/lib/translation/cache';
import { useLanguage }                   from './useLanguage';

export type DynamicTranslateOptions = {
  from?: string;
  batchDelay?: number; // ms to wait before sending a batch (default: 0)
};

export function useDynamicTranslation(defaults: DynamicTranslateOptions = {}) {
  const { currentLocale } = useLanguage();
  const [isLoading, setIsLoading]  = useState(false);
  const pendingRef = useRef<Map<string, Promise<string>>>(new Map());

  /**
   * Translate a single string.
   * Returns immediately from cache if available.
   */
  const translate = useCallback(
    async (text: string, from = defaults.from ?? 'en'): Promise<string> => {
      if (!text.trim() || currentLocale === from) return text;

      const cKey = `${from}→${currentLocale}:${text}`;

      // 1. Client cache hit
      const cached = clientTranslationCache.get(cKey);
      if (cached !== undefined) return cached;

      // 2. Deduplicate in-flight requests for the same text
      if (pendingRef.current.has(cKey)) {
        return pendingRef.current.get(cKey)!;
      }

      const promise = (async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/translate', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ text, from, to: currentLocale }),
          });

          if (!res.ok) return text;

          const data = await res.json();
          const translated: string = data.translations?.[0]?.translatedText ?? text;
          clientTranslationCache.set(cKey, translated);
          return translated;
        } catch {
          return text;
        } finally {
          setIsLoading(false);
          pendingRef.current.delete(cKey);
        }
      })();

      pendingRef.current.set(cKey, promise);
      return promise;
    },
    [currentLocale, defaults.from]
  );

  /**
   * Translate an array of strings in a single API call (batching).
   * Cache is checked per-item; only uncached strings hit the network.
   */
  const translateBatch = useCallback(
    async (texts: string[], from = defaults.from ?? 'en'): Promise<string[]> => {
      if (!texts.length || currentLocale === from) return texts;

      const results: string[]  = [...texts];
      const uncachedIdx: number[]  = [];
      const uncachedTexts: string[] = [];

      texts.forEach((text, i) => {
        const cKey = `${from}→${currentLocale}:${text}`;
        const hit  = clientTranslationCache.get(cKey);
        if (hit !== undefined) {
          results[i] = hit;
        } else {
          uncachedIdx.push(i);
          uncachedTexts.push(text);
        }
      });

      if (uncachedTexts.length === 0) return results;

      setIsLoading(true);
      try {
        const res = await fetch('/api/translate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text: uncachedTexts, from, to: currentLocale }),
        });

        if (!res.ok) return results;

        const data = await res.json();
        (data.translations as Array<{ translatedText: string }>).forEach((t, j) => {
          const idx  = uncachedIdx[j];
          const cKey = `${from}→${currentLocale}:${uncachedTexts[j]}`;
          results[idx] = t.translatedText;
          clientTranslationCache.set(cKey, t.translatedText);
        });

        return results;
      } catch {
        return results;
      } finally {
        setIsLoading(false);
      }
    },
    [currentLocale, defaults.from]
  );

  return { translate, translateBatch, isLoading, currentLocale };
}
