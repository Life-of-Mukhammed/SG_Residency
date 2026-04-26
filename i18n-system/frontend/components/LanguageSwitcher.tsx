'use client';
// ─── LanguageSwitcher ───────────────────────────────────────────────────────
// Dropdown component that lets the user pick a locale.
// Integrates with useLanguage for one-call switching.

import { useEffect, useRef, useState } from 'react';
import { useLanguage }  from '@/lib/hooks/useLanguage';
import { type Locale }  from '@/lib/i18n/config';

type Variant = 'dropdown' | 'buttons';

type Props = {
  variant?: Variant;
  className?: string;
};

export default function LanguageSwitcher({ variant = 'dropdown', className = '' }: Props) {
  const { currentLocale, switchLocale, locales, localeLabels } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Button variant ──────────────────────────────────────────────────────
  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            title={localeLabels[locale].label}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              locale === currentLocale
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {localeLabels[locale].flag} {locale.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // ── Dropdown variant (default) ──────────────────────────────────────────
  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{localeLabels[currentLocale].flag}</span>
        <span className="text-gray-700 dark:text-gray-200">{localeLabels[currentLocale].native}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1.5 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50 animate-fade-in"
        >
          {locales.map((locale: Locale) => {
            const active = locale === currentLocale;
            return (
              <li key={locale} role="option" aria-selected={active}>
                <button
                  onClick={() => { switchLocale(locale); setOpen(false); }}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  <span className="text-base">{localeLabels[locale].flag}</span>
                  <span className="flex-1 text-left">{localeLabels[locale].native}</span>
                  {active && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
