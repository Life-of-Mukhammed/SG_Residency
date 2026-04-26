'use client';
// ─── useLanguage hook ───────────────────────────────────────────────────────
// Reads the current locale from the URL path and provides a switcher function
// that updates the URL, cookie, localStorage, and i18next simultaneously.

import { usePathname, useRouter } from 'next/navigation';
import { useTranslation }         from 'react-i18next';
import { useCallback }            from 'react';
import { LOCALES, DEFAULT_LOCALE, LOCALE_LABELS, isValidLocale, type Locale } from '@/lib/i18n/config';

export function useLanguage() {
  const pathname = usePathname();
  const router   = useRouter();
  const { i18n } = useTranslation();

  // Derive locale from the URL segment e.g. /ru/about → 'ru'
  const currentLocale: Locale = (() => {
    const segment = pathname.split('/')[1];
    return isValidLocale(segment) ? segment : DEFAULT_LOCALE;
  })();

  /**
   * Switch the app language.
   * 1. Persists to cookie (for middleware SSR redirect)
   * 2. Persists to localStorage (for browser-side detection)
   * 3. Tells i18next to change its internal language
   * 4. Navigates to the same route under the new locale prefix
   */
  const switchLocale = useCallback(
    (locale: Locale) => {
      if (locale === currentLocale) return;

      // 1. Cookie — read by middleware on next navigation
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;

      // 2. localStorage — read by LanguageDetector on page load
      localStorage.setItem('i18next_lng', locale);

      // 3. i18next instance
      i18n.changeLanguage(locale);

      // 4. Swap the locale prefix in the URL
      const newPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, `/${locale}`);
      router.push(newPath);
      router.refresh();
    },
    [currentLocale, pathname, router, i18n]
  );

  return {
    currentLocale,
    switchLocale,
    locales:      [...LOCALES] as Locale[],
    localeLabels: LOCALE_LABELS,
  };
}
