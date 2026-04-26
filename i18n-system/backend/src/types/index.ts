export type Locale = 'en' | 'ru' | 'uz';

export const LOCALES: Locale[] = ['en', 'ru', 'uz'];

export const GOOGLE_LANG_CODES: Record<Locale, string> = {
  en: 'en',
  ru: 'ru',
  uz: 'uz',
};

export function isValidLocale(v: unknown): v is Locale {
  return LOCALES.includes(v as Locale);
}

export type TranslateRequest = {
  text: string | string[];
  from: string;
  to:   Locale;
};

export type TranslateResult = {
  translatedText:    string;
  detectedLanguage?: string;
  fromCache:         boolean;
};
