'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import {
  Megaphone, Save, ToggleLeft, ToggleRight, X, Eye, EyeOff,
  Image as ImageIcon, Link as LinkIcon, Type, AlignLeft,
  Smartphone, Globe, CheckCircle2, Loader2,
} from 'lucide-react';

interface AdSettings {
  title: string;
  description: string;
  bannerImage: string;
  websiteUrl: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  enabled: boolean;
}

const DEFAULT: AdSettings = {
  title: '', description: '', bannerImage: '',
  websiteUrl: '', appStoreUrl: '', googlePlayUrl: '', enabled: true,
};

export default function AdsPage() {
  const [form, setForm] = useState<AdSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get('/api/ad-settings').then((r) => {
      const s = r.data.settings;
      if (s) setForm({
        title: s.title || '',
        description: s.description || '',
        bannerImage: s.bannerImage || '',
        websiteUrl: s.websiteUrl || '',
        appStoreUrl: s.appStoreUrl || '',
        googlePlayUrl: s.googlePlayUrl || '',
        enabled: s.enabled !== false,
      });
    }).catch(() => toast.error('Yuklab bo\'lmadi')).finally(() => setLoading(false));
  }, []);

  const set = (key: keyof AdSettings, val: string | boolean) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('bannerImage', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put('/api/ad-settings', form);
      toast.success('Reklama sozlamalari saqlandi');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error('Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header title="Reklama sozlamalari" subtitle="Founders School reklamasini boshqaring" />
        <div className="p-6 flex items-center justify-center min-h-64">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title="Reklama sozlamalari" subtitle="Founders School reklamasini boshqaring" />
      <div className="p-6 space-y-6">

        {/* Top status bar */}
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: form.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.12)', color: form.enabled ? '#10b981' : 'var(--text-muted)' }}>
              <Megaphone size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Reklama holati
              </p>
              <p className="text-xs" style={{ color: form.enabled ? '#10b981' : 'var(--text-muted)' }}>
                {form.enabled ? 'Faol — foydalanuvchilarga ko\'rinadi' : 'O\'chirilgan — hech kim ko\'rmaydi'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPreview(p => !p)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? 'Previewni yashirish' : 'Preview ko\'rish'}
            </button>
            <button
              onClick={() => set('enabled', !form.enabled)}
              style={{ color: form.enabled ? '#10b981' : 'var(--text-muted)', transition: 'color 0.2s' }}
            >
              {form.enabled
                ? <ToggleRight size={36} />
                : <ToggleLeft size={36} />}
            </button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-5' : 'grid-cols-1'}`}>

          {/* ── Left: Form ── */}
          <div className={`space-y-5 ${showPreview ? 'lg:col-span-3' : ''}`}>

            {/* Banner image */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                  <ImageIcon size={15} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Banner rasmi</p>
              </div>
              {form.bannerImage ? (
                <div className="relative rounded-2xl overflow-hidden group">
                  <img src={form.bannerImage} alt="Banner" className="w-full object-cover" style={{ maxHeight: 200 }} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => set('bannerImage', '')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                      style={{ background: 'rgba(239,68,68,0.9)' }}
                    >
                      <X size={14} /> Rasmni o'chirish
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed cursor-pointer py-10 gap-3 transition-colors hover:border-indigo-400"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>
                    <ImageIcon size={22} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Rasm yuklash</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG yoki WebP. 1200×400 tavsiya etiladi</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                </label>
              )}
            </div>

            {/* Text content */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                  <Type size={15} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Matn ma'lumotlari</p>
              </div>
              <div>
                <label className="label">Sarlavha</label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  className="input"
                  placeholder="Founders School"
                />
              </div>
              <div>
                <label className="label">Tavsif matni</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Bo'lajak asoschilarga kerak bo'lgan barcha bilimlar bir joyda jamlandi..."
                />
              </div>
            </div>

            {/* Links */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                  <LinkIcon size={15} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Havolalar</p>
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <Globe size={13} /> Sayt manzili
                </label>
                <input
                  value={form.websiteUrl}
                  onChange={(e) => set('websiteUrl', e.target.value)}
                  className="input font-mono text-sm"
                  placeholder="https://sgfounders.school/download"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-2">
                    <Smartphone size={13} /> App Store
                  </label>
                  <input
                    value={form.appStoreUrl}
                    onChange={(e) => set('appStoreUrl', e.target.value)}
                    className="input font-mono text-sm"
                    placeholder="https://apps.apple.com/..."
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Smartphone size={13} /> Google Play
                  </label>
                  <input
                    value={form.googlePlayUrl}
                    onChange={(e) => set('googlePlayUrl', e.target.value)}
                    className="input font-mono text-sm"
                    placeholder="https://play.google.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary flex items-center gap-2.5 px-6 py-3 text-sm font-semibold w-full justify-center"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saqlanmoqda...</>
              ) : saved ? (
                <><CheckCircle2 size={16} /> Saqlandi!</>
              ) : (
                <><Save size={16} /> Sozlamalarni saqlash</>
              )}
            </button>
          </div>

          {/* ── Right: Live Preview ── */}
          {showPreview && (
            <div className="lg:col-span-2 space-y-4">
              <div className="sticky top-20">
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={14} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Jonli preview
                  </p>
                </div>

                {/* Desktop preview */}
                <div className="card overflow-hidden">
                  <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 h-5 rounded-md text-center text-[10px] flex items-center justify-center" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      sgresidency.uz
                    </div>
                  </div>

                  {!form.enabled ? (
                    <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>
                      <EyeOff size={24} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Reklama o'chirilgan</p>
                    </div>
                  ) : (
                    <div>
                      {form.bannerImage ? (
                        <img src={form.bannerImage} alt="Banner" className="w-full object-cover" style={{ maxHeight: 130 }} />
                      ) : (
                        <div className="flex items-center justify-center h-24 text-xs"
                          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', color: 'var(--text-muted)' }}>
                          <ImageIcon size={20} className="mr-2 opacity-50" />
                          Banner rasmi
                        </div>
                      )}
                      <div className="p-4" style={{ background: 'var(--bg-secondary)' }}>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {form.title || <span className="opacity-40">Sarlavha...</span>}
                        </p>
                        {form.description && (
                          <p className="text-xs mt-1 leading-5" style={{ color: 'var(--text-muted)' }}>
                            {form.description.length > 80 ? form.description.slice(0, 80) + '...' : form.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {form.websiteUrl && (
                            <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                              style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', color: 'var(--accent)' }}>
                              🌐 Sayt
                            </span>
                          )}
                          {form.appStoreUrl && (
                            <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                              style={{ background: 'rgba(0,0,0,0.15)', color: '#f8fafc' }}>
                              🍎 App Store
                            </span>
                          )}
                          {form.googlePlayUrl && (
                            <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                              ▶ Google Play
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info card */}
                <div className="card p-4 mt-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>Reklama qayerda ko'rinadi?</p>
                  <ul className="space-y-1.5">
                    {['Dashboard bosh sahifasi', 'Hisobotlar sahifasi', 'Sprint sahifasi'].map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
