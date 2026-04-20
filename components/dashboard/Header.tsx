'use client';

import { useSession } from 'next-auth/react';
import { Sun, Moon, Globe, Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';

type HeaderProps = {
  title?: string;
  subtitle?: string;
};

const LANGS = [
  { code: 'uz' as const, label: "O'z", flag: '🇺🇿' },
  { code: 'ru' as const, label: 'Ру', flag: '🇷🇺' },
  { code: 'en' as const, label: 'En', flag: '🇬🇧' },
];

export default function Header({ title = 'Dashboard', subtitle }: HeaderProps) {
  const { data: session } = useSession();
  const { lang, setLang, theme, toggleTheme, notifications, markAllRead } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => setMounted(true), []);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
      style={{
        background: 'rgba(var(--bg-primary-rgb, 13,13,26), 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">

        {/* 🔔 Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs) markAllRead();
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Bell size={15} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] rounded-full text-white flex items-center justify-center"
                style={{ background: '#ef4444' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl z-50"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

              <div className="px-4 py-3 border-b flex justify-between">
                <span className="text-sm font-semibold">Notifications</span>
                <button onClick={() => setShowNotifs(false)}>
                  <X size={14} />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm">No notifications</p>
                ) : notifications.slice(0, 8).map(n => (
                  <div key={n.id} className="px-4 py-3 border-b">
                    <p className="text-xs font-semibold">{n.title}</p>
                    <p className="text-xs opacity-70">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🌐 Language */}
        <div className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="px-3 py-2 rounded-xl text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            🌐 {lang}
          </button>

          {showLang && (
            <div className="absolute right-0 mt-2 rounded-xl shadow-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setShowLang(false);
                  }}
                  className="block w-full px-4 py-2 text-sm text-left"
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 🌙 Theme */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {mounted && theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

      </div>
    </header>
  );
}
