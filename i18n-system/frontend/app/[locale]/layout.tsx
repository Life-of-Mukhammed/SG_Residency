// ─── [locale] layout — sets <html lang>, injects I18nProvider ──────────────
import type { Metadata } from 'next';
import { notFound }       from 'next/navigation';
import { isValidLocale, LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import I18nProvider       from '@/components/providers/I18nProvider';
import LanguageSwitcher   from '@/components/LanguageSwitcher';
import Link               from 'next/link';
import '../globals.css';

type Props = {
  children: React.ReactNode;
  params:   { locale: string };
};

// ── SEO: generate <link rel="alternate"> for every locale ──────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isValidLocale(params.locale)) return {};
  return {
    title:       'i18n Demo',
    description: 'Full multilingual app with react-i18next + Google Translate',
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `https://example.com/${l}`])
      ),
    },
  };
}

// ── Static path generation (SSG) ──────────────────────────────────────────
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({ children, params: { locale } }: Props) {
  if (!isValidLocale(locale)) notFound();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <I18nProvider locale={locale as Locale}>
          {/* ── Nav ── */}
          <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <nav className="flex items-center gap-6">
                <Link href={`/${locale}`} className="font-bold text-indigo-600">i18n Demo</Link>
                <Link href={`/${locale}/about`}   className="text-sm hover:text-indigo-600 transition-colors">About</Link>
                <Link href={`/${locale}/dynamic`} className="text-sm hover:text-indigo-600 transition-colors">Dynamic</Link>
              </nav>
              <LanguageSwitcher />
            </div>
          </header>

          <main className="max-w-5xl mx-auto px-4 py-10">
            {children}
          </main>

          <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-gray-400">
            Current locale: <strong>{locale}</strong> · {LOCALE_LABELS[locale as Locale].flag} {LOCALE_LABELS[locale as Locale].label}
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
