// ─── Server-side i18n (React Server Components) ────────────────────────────
// Creates a fresh i18next instance per-request to avoid state bleed between
// concurrent requests. Resources are loaded from the local /locales directory.

import { createInstance } from 'i18next';
import { initReactI18next }  from 'react-i18next/initReactI18next';
import resourcesToBackend    from 'i18next-resources-to-backend';
import { getOptions, type Locale, type Namespace } from './config';

async function initServerI18n(locale: Locale, ns: Namespace | Namespace[]) {
  const i18n = createInstance();
  await i18n
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`@/locales/${language}/${namespace}.json`)
      )
    )
    .init(getOptions(locale, ns));
  return i18n;
}

/**
 * Use in Server Components:
 *   const { t } = await useServerTranslation(locale, 'home');
 *   return <h1>{t('hero.title')}</h1>;
 */
export async function useServerTranslation(
  locale: Locale,
  ns: Namespace | Namespace[] = 'common',
  options: { keyPrefix?: string } = {}
) {
  const i18n = await initServerI18n(locale, ns);
  const primaryNs = Array.isArray(ns) ? ns[0] : ns;
  return {
    t:    i18n.getFixedT(locale, primaryNs, options.keyPrefix),
    i18n,
  };
}
