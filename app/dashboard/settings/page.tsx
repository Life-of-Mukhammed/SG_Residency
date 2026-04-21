'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { useAppStore } from '@/store/appStore';
import { Bell, Check, Globe, Lock, Moon, Save, Shield, Sun, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

const LANGS = [
  { code: 'uz' as const, label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
];

const EMPTY_FORM = {
  name: '',
  surname: '',
  email: '',
  avatar: '',
  currentPassword: '',
  newPassword: '',
};

export default function SettingsPage() {
  const { t, lang, setLang, theme, setTheme } = useAppStore();
  const { update } = useSession();
  const [form, setForm] = useState(EMPTY_FORM);
  const [profile, setProfile] = useState<any>(null);
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/profile')
      .then((res) => {
        const user = res.data.user;
        setProfile(user);
        setStartup(res.data.startup ?? null);
        setForm({
          name: user?.name ?? '',
          surname: user?.surname ?? '',
          email: user?.email ?? '',
          avatar: user?.avatar ?? '',
          currentPassword: '',
          newPassword: '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const setField = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.patch('/api/profile', form);
      setProfile(res.data.user);
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      await update({
        name: `${res.data.user.name} ${res.data.user.surname}`,
        email: res.data.user.email,
      });
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const permissions = [
    { label: 'Edit own profile', has: true },
    { label: 'Change password', has: true },
    { label: 'Apply to residency', has: profile?.role === 'user' },
    { label: 'View reports, meetings, sprint, GTM', has: profile?.role !== 'user' || startup?.status === 'active' },
    { label: 'Manage startups', has: ['manager', 'super_admin'].includes(profile?.role) },
    { label: 'Review reports', has: ['manager', 'super_admin'].includes(profile?.role) },
    { label: 'User role management', has: profile?.role === 'super_admin' },
  ];

  if (loading) {
    return (
      <div>
        <Header title={t('settings')} subtitle="Profile and workspace preferences" />
        <div className="p-8 max-w-5xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title={t('settings')} subtitle="Profile and workspace preferences" />
      <div className="p-8 max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <User size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('profile')}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keep your personal information up to date.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">First name</label>
                <input value={form.name} onChange={setField('name')} className="input notranslate" translate="no" />
              </div>
              <div>
                <label className="label">Last name</label>
                <input value={form.surname} onChange={setField('surname')} className="input notranslate" translate="no" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Email</label>
                <input value={form.email} onChange={setField('email')} className="input notranslate" translate="no" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Avatar URL</label>
                <input value={form.avatar} onChange={setField('avatar')} className="input notranslate" translate="no" placeholder="https://..." />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <Lock size={16} style={{ color: 'var(--accent)' }} />
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Password update</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Current password</label>
                  <input value={form.currentPassword} onChange={setField('currentPassword')} type="password" className="input" />
                </div>
                <div>
                  <label className="label">New password</label>
                  <input value={form.newPassword} onChange={setField('newPassword')} type="password" className="input" />
                </div>
              </div>
            </div>

            <button onClick={saveProfile} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> Save profile</>}
            </button>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Globe size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('language')}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Switch both app labels and Google page translation.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {LANGS.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLang(item.code)}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: lang === item.code ? 'var(--accent)' : 'var(--border)',
                    background: lang === item.code ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                  }}
                >
                  <span className="text-2xl notranslate" translate="no">{item.flag}</span>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  </div>
                  {lang === item.code && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                {theme === 'dark' ? <Moon size={18} style={{ color: 'var(--accent)' }} /> : <Sun size={18} style={{ color: 'var(--accent)' }} />}
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('theme')}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Choose the interface mood that suits you best.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['dark', 'light'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTheme(item)}
                  className="flex items-center gap-4 p-5 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: theme === item ? 'var(--accent)' : 'var(--border)',
                    background: theme === item ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item === 'dark' ? '#0d0d1a' : '#f8f9fc', border: '1px solid var(--border)' }}>
                    {item === 'dark' ? <Moon size={18} style={{ color: '#6366f1' }} /> : <Sun size={18} style={{ color: '#f59e0b' }} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item === 'dark' ? t('darkMode') : t('lightMode')}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item === 'dark' ? 'Deep contrast for long sessions' : 'Bright, clean, and airy'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-bold text-white notranslate" translate="no" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {profile?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold truncate notranslate" translate="no" style={{ color: 'var(--text-primary)' }}>
                  {profile?.name} {profile?.surname}
                </p>
                <p className="text-sm truncate notranslate" translate="no" style={{ color: 'var(--text-muted)' }}>{profile?.email}</p>
                <span className={`badge mt-2 capitalize ${profile?.role === 'super_admin' ? 'badge-rejected' : profile?.role === 'manager' ? 'badge-mvp' : 'badge-active'}`}>
                  {profile?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <Bell size={17} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Residency access</h3>
            </div>
            {startup ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Startup</p>
                  <p className="font-semibold notranslate" translate="no" style={{ color: 'var(--text-primary)' }}>{startup.startup_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
                    <span className={`badge badge-${startup.status}`}>{startup.status}</span>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Stage</p>
                    <span className={`badge badge-${startup.stage}`}>{startup.stage}</span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {startup.status === 'active'
                    ? 'Your startup is approved. Reports, meetings, sprint, and GTM are unlocked.'
                    : 'Your application is still waiting for approval. Core founder tools stay locked until manager or admin approval.'}
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No residency application submitted yet.</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <Shield size={17} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Role permissions</h3>
            </div>
            <div className="space-y-2">
              {permissions.map(({ label, has }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="text-xs font-semibold" style={{ color: has ? '#10b981' : '#64748b' }}>
                    {has ? '✓ Allowed' : '✗ Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
