'use client';

import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { GoogleTranslatePill } from '@/components/GoogleTranslateSwitcher';

export function AuthPreferences() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <GoogleTranslatePill />
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
