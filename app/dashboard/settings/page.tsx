'use client';

import { useSession } from 'next-auth/react';
import Header from '@/components/dashboard/Header';
import { useAppStore } from '@/store/appStore';
import { Shield, Globe, Moon, Sun, Bell, User, Check } from 'lucide-react';

const LANGS = [
  { code: 'uz' as const, label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const { t, lang, setLang, theme, setTheme } = useAppStore();

  return (
    <div className="animate-fade-in">
      <Header title={t('settings')} subtitle="Manage your account and preferences" />
      <div className="p-8 max-w-2xl mx-auto space-y-6">

        {/* Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              <User size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('profile')}</h3>
          </div>
          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              <span className={`badge mt-1 capitalize ${user?.role === 'super_admin' ? 'badge-rejected' : user?.role === 'manager' ? 'badge-mvp' : 'badge-active'}`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            To update your profile details, contact your program manager.
          </p>
        </div>

        {/* Language */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Globe size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('language')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all"
                style={{
                  borderColor: lang === l.code ? 'var(--accent)' : 'var(--border)',
                  background:  lang === l.code ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                }}
              >
                <span className="text-2xl">{l.flag}</span>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{l.label}</p>
                </div>
                {lang === l.code && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              {theme === 'dark' ? <Moon size={16} style={{ color: 'var(--accent)' }} /> : <Sun size={16} style={{ color: 'var(--accent)' }} />}
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('theme')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as const).map(th => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className="flex items-center gap-4 p-5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: theme === th ? 'var(--accent)' : 'var(--border)',
                  background:  theme === th ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: th === 'dark' ? '#0d0d1a' : '#f8f9fc', border: '1px solid var(--border)' }}>
                  {th === 'dark'
                    ? <Moon size={18} style={{ color: '#6366f1' }} />
                    : <Sun  size={18} style={{ color: '#f59e0b' }} />}
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {th === 'dark' ? t('darkMode') : t('lightMode')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {th === 'dark' ? 'Easy on the eyes at night' : 'Clean and bright'}
                  </p>
                </div>
                {theme === th && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Shield size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Role & Permissions</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Submit startup application',   has: true },
              { label: 'Submit weekly reports',        has: true },
              { label: 'Book meetings',                has: true },
              { label: 'GTM resources access',         has: true },
              { label: 'Sprint roadmap',               has: true },
              { label: 'Library access',               has: true },
              { label: 'Manage startups',              has: ['manager','super_admin'].includes(user?.role) },
              { label: 'Review & accept reports',      has: ['manager','super_admin'].includes(user?.role) },
              { label: 'Create meeting slots',         has: ['manager','super_admin'].includes(user?.role) },
              { label: 'GTM & Sprint CRUD',            has: ['manager','super_admin'].includes(user?.role) },
              { label: 'System-wide analytics',        has: user?.role === 'super_admin' },
              { label: 'User role management',         has: user?.role === 'super_admin' },
            ].map(({ label, has }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b"
                style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className="text-xs font-semibold" style={{ color: has ? '#10b981' : '#64748b' }}>
                  {has ? '✓ Allowed' : '✗ Restricted'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Bell size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('notifications')}</h3>
          </div>
          {[
            { label: 'Weekly report reminder',  desc: 'Every Saturday at 9:00 AM',             on: true  },
            { label: 'Meeting notifications',   desc: 'When a meeting is booked or cancelled', on: true  },
            { label: 'Report feedback',         desc: 'When manager reviews your report',       on: true  },
            { label: 'New meeting booking',     desc: '(Manager) When founder books a slot',   on: user?.role !== 'user' },
          ].map(n => (
            <div key={n.label} className="flex items-start justify-between gap-4 py-3 border-b"
              style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.desc}</p>
              </div>
              <div
                className="flex-shrink-0 w-10 h-6 rounded-full flex items-center transition-all cursor-pointer"
                style={{
                  background: n.on ? 'var(--accent)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  padding: '2px',
                }}
              >
                <div className="w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: n.on ? 'translateX(16px)' : 'translateX(0)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
