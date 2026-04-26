// ─── Core i18n Configuration ───────────────────────────────────────────────
// Single source of truth for all i18n settings across server and client.

export const LOCALES = ['en', 'ru', 'uz'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const FALLBACK_LOCALE: Locale = 'en';

export const NAMESPACES = ['common', 'home', 'about'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const LOCALE_LABELS: Record<Locale, { label: string; native: string; flag: string }> = {
  en: { label: 'English',  native: 'English',  flag: '🇺🇸' },
  ru: { label: 'Russian',  native: 'Русский',  flag: '🇷🇺' },
  uz: { label: 'Uzbek',    native: "O'zbek",   flag: '🇺🇿' },
};

// Google Translate language codes (used in API calls)
export const GOOGLE_LANG_CODES: Record<Locale, string> = {
  en: 'en',
  ru: 'ru',
  uz: 'uz',
};

export function isValidLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Returns the shared init options used by both client and server i18next instances. */
export function getOptions(locale: Locale = DEFAULT_LOCALE, ns: Namespace | Namespace[] = 'common') {
  return {
    debug:         process.env.NODE_ENV === 'development',
    supportedLngs: LOCALES,
    fallbackLng:   FALLBACK_LOCALE,
    lng:           locale,
    ns:            Array.isArray(ns) ? ns : [ns],
    defaultNS:     Array.isArray(ns) ? ns[0] : ns,
    interpolation: { escapeValue: false },
    react:         { useSuspense: false },
  };
}
