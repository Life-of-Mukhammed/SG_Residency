// ─── Home page — Server Component ──────────────────────────────────────────
// Demonstrates static translations (JSON files) via useServerTranslation.
// Dynamic news items are passed to <DynamicText> for runtime translation.

import { useServerTranslation } from '@/lib/i18n/server';
import { isValidLocale, type Locale } from '@/lib/i18n/config';
import DynamicText  from '@/components/DynamicText';
import Link         from 'next/link';
import { notFound } from 'next/navigation';

type Props = { params: { locale: string } };

// Simulated dynamic content from a database (always stored in English)
const DB_NEWS = [
  { id: 1, text: 'New startup accelerator program launched in Silicon Valley' },
  { id: 2, text: 'Tech conference brings together 500 founders from 30 countries' },
  { id: 3, text: 'AI startup raises $50M Series B funding round in record time' },
];

const DB_FEATURES = [
  { id: 1, icon: '🌐', title: 'Static Translations', body: 'JSON files loaded by react-i18next. Zero network cost, instant render.' },
  { id: 2, icon: '🤖', title: 'Dynamic Translation', body: 'Google Cloud API translates DB content on the fly with server-side caching.' },
  { id: 3, icon: '🔍', title: 'Auto Language Detection', body: 'Browser language and cookies are used to redirect users automatically.' },
  { id: 4, icon: '⚡', title: 'Optimised Performance', body: 'Server-side LRU cache + client-side Map ensure translations are never fetched twice.' },
];

export default async function HomePage({ params }: Props) {
  if (!isValidLocale(params.locale)) notFound();
  const locale = params.locale as Locale;

  const { t } = await useServerTranslation(locale, 'home');

  return (
    <div className="space-y-16">
      {/* ── Hero ── */}
      <section className="text-center py-12 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800">
          {t('hero.badge')}
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={`/${locale}/dynamic`}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            {t('hero.cta')}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('hero.secondary')}
          </Link>
        </div>
      </section>

      {/* ── Feature grid (static translations) ── */}
      <section>
        <h2 className="text-2xl font-bold mb-2">{t('features.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('features.subtitle')}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {DB_FEATURES.map((f) => (
            <div key={f.id} className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 space-y-2">
              <div className="text-3xl">{f.icon}</div>
              {/* Title and body come from DB → DynamicText translates at runtime */}
              <DynamicText text={f.title} from="en" as="h3"
                className="font-bold text-gray-900 dark:text-gray-100" />
              <DynamicText text={f.body}  from="en" as="p"
                className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Dynamic news section ── */}
      <section>
        <h2 className="text-2xl font-bold mb-2">{t('news.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('news.subtitle')}</p>
        <div className="space-y-3">
          {DB_NEWS.map((item) => (
            <article
              key={item.id}
              className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                {item.id}
              </div>
              {/* DynamicText auto-translates the English DB text */}
              <DynamicText
                text={item.text}
                from="en"
                as="p"
                className="text-sm leading-relaxed"
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
