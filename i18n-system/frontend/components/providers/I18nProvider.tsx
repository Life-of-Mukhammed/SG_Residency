'use client';
// ─── I18nProvider ───────────────────────────────────────────────────────────
// Wraps the subtree in the react-i18next provider and keeps the client-side
// i18next instance in sync with the locale that the Server Component resolved
// from the URL.

import { I18nextProvider }  from 'react-i18next';
import { useEffect, useRef } from 'react';
import i18next               from '@/lib/i18n/client';
import { type Locale }       from '@/lib/i18n/config';

type Props = {
  locale:   Locale;
  children: React.ReactNode;
};

export default function I18nProvider({ locale, children }: Props) {
  const activeLocale = useRef(locale);

  useEffect(() => {
    if (activeLocale.current === locale) return;
    activeLocale.current = locale;
    i18next.changeLanguage(locale);
  }, [locale]);

  // Ensure the singleton starts with the SSR locale
  if (i18next.language !== locale && !i18next.isInitializing) {
    i18next.changeLanguage(locale);
  }

  return (
    <I18nextProvider i18n={i18next} defaultNS="common">
      {children}
    </I18nextProvider>
  );
}
