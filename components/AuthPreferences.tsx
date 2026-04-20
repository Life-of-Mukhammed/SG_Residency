'use client';

import { Globe, Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const LANG_OPTIONS = [
  { code: 'uz', label: "O'z" },
  { code: 'ru', label: 'Ру' },
  { code: 'en', label: 'En' },
] as const;

export function AuthPreferences() {
  const { lang, setLang, theme, toggleTheme } = useAppStore();

  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2 rounded-2xl p-1.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <Globe size={16} />
        </span>
        {LANG_OPTIONS.map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => setLang(option.code)}
            className="rounded-xl px-3 py-2 text-sm font-medium transition-all"
            style={{
              background: lang === option.code ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: lang === option.code ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
