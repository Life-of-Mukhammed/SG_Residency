'use client';
// GoogleTranslateSwitcher
// Calls window.__setGoogleTranslateLanguage (defined in layout.tsx) which
// controls the hidden Google Translate widget and translates the entire page.
// Saves preference to localStorage so it persists across page loads.

import { useEffect, useState } from 'react';

export const LANGS = [
  { code: 'uz', label: "O'zbek", short: 'UZ', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇺🇸' },
] as const;

type LangCode = (typeof LANGS)[number]['code'];

function applyLang(lang: LangCode) {
  localStorage.setItem('residency_lang', lang);
  document.documentElement.setAttribute('data-lang', lang);
  (window as any).__setGoogleTranslateLanguage?.(lang);
}

// ── Full variant (sidebar open) ────────────────────────────────────────────
export function GoogleTranslateSwitcher({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState<LangCode>('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('residency_lang') as LangCode) || 'uz';
    setActive(saved);
  }, []);

  const switchLang = (lang: LangCode) => {
    setActive(lang);
    applyLang(lang);
  };

  if (!mounted) return null;

  // ── Compact: icon-only (sidebar collapsed) ────────────────────────────
  if (compact) {
    return (
      <div className="flex flex-col gap-1 items-center">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => switchLang(l.code)}
            title={l.label}
            className="notranslate w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
            translate="no"
            style={{
              background: active === l.code
                ? 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2))'
                : 'transparent',
              color:  active === l.code ? 'var(--accent)' : 'var(--text-muted)',
              border: active === l.code ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            }}
          >
            {l.flag}
          </button>
        ))}
      </div>
    );
  }

  // ── Full: flag + label (sidebar open) ────────────────────────────────
  return (
    <div
      className="notranslate rounded-2xl p-1.5 flex flex-col gap-0.5"
      translate="no"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
    >
      {LANGS.map((l) => {
        const isActive = active === l.code;
        return (
          <button
            key={l.code}
            onClick={() => switchLang(l.code)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left w-full"
            style={{
              background: isActive
                ? 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))'
                : 'transparent',
              color:  isActive ? 'var(--accent)' : 'var(--text-muted)',
              border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
            }}
          >
            <span className="text-base leading-none">{l.flag}</span>
            <span className="flex-1 text-left">{l.label}</span>
            {isActive && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Horizontal pill (auth pages / header) ─────────────────────────────────
export function GoogleTranslatePill() {
  const [active, setActive] = useState<LangCode>('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('residency_lang') as LangCode) || 'uz';
    setActive(saved);
  }, []);

  const switchLang = (lang: LangCode) => {
    setActive(lang);
    applyLang(lang);
  };

  if (!mounted) return null;

  return (
    <div
      className="notranslate inline-flex items-center gap-0.5 p-1 rounded-2xl"
      translate="no"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {LANGS.map((l) => {
        const isActive = active === l.code;
        return (
          <button
            key={l.code}
            onClick={() => switchLang(l.code)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: isActive ? 'var(--accent)' : 'transparent',
              color:  isActive ? '#fff' : 'var(--text-muted)',
              boxShadow: isActive ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            <span>{l.flag}</span>
            <span>{l.short}</span>
          </button>
        );
      })}
    </div>
  );
}
