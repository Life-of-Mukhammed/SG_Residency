'use client';
// ─── Client-side i18n singleton ────────────────────────────────────────────
// Initialised once in the browser. Uses LanguageDetector so the language is
// automatically read from localStorage → navigator.language on first visit.

import i18next              from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend   from 'i18next-resources-to-backend';
import LanguageDetector     from 'i18next-browser-languagedetector';
import { getOptions, LOCALES, DEFAULT_LOCALE } from './config';

const runsOnServer = typeof window === 'undefined';

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`@/locales/${language}/${namespace}.json`)
    )
  )
  .init({
    ...getOptions(),
    lng:     undefined,          // let the detector decide
    preload: runsOnServer ? [...LOCALES] : [],
    detection: {
      // 1st: localStorage key  2nd: browser navigator.language
      order:            ['localStorage', 'navigator'],
      caches:           ['localStorage'],
      lookupLocalStorage: 'i18next_lng',
      // Normalise "en-US" → "en"
      convertDetectedLanguage: (lng: string) => lng.split('-')[0] as any,
    },
    fallbackLng: DEFAULT_LOCALE,
  });

export default i18next;
