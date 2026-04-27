'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewReportPage() {
  const router = useRouter();
  const [startup, setStartup] = useState<any>(null);
  const [weekCount, setWeekCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ completed: '', notCompleted: '', plans: '' });

  useEffect(() => {
    Promise.all([
      axios.get('/api/startups?limit=1'),
      axios.get('/api/reports?limit=3'),
    ]).then(([startupRes, reportsRes]) => {
      setStartup(startupRes.data.startups?.[0] ?? null);
      // Count reports submitted this week
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      weekStart.setHours(0, 0, 0, 0);
      const thisWeek = (reportsRes.data.reports ?? []).filter(
        (r: any) => new Date(r.weekStart) >= weekStart
      );
      setWeekCount(thisWeek.length);
    }).finally(() => setInitialLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.completed.trim() || !form.notCompleted.trim() || !form.plans.trim()) {
      toast.error('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/reports', form);
      toast.success('Hisobot muvaffaqiyatli yuborildi! 🎉');
      router.push('/dashboard/reports');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Hisobot yuborib bo\'lmadi');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8"><div className="skeleton h-64 rounded-2xl max-w-2xl mx-auto" /></div>;
  }

  if (!startup || startup.status !== 'active') {
    return (
      <div className="animate-fade-in">
        <Header title="Haftalik hisobot yuborish" subtitle="Tasdiq talab qilinadi" />
        <div className="p-8 max-w-2xl mx-auto">
          <div className="card text-center py-14">
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Hisobotlar qulflangan</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Haftalik hisobotlar yuborish uchun startapingiz tasdiqlanishi kerak.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title="Haftalik hisobot yuborish" subtitle="Bu haftadagi progressingizni baham ko'ring" />
      <div className="p-8 max-w-2xl mx-auto">
        <Link href="/dashboard/reports">
          <button className="btn-secondary flex items-center gap-2 mb-6 text-sm">
            <ArrowLeft size={14} /> Hisobotlarga qaytish
          </button>
        </Link>

        <div className="card p-8">
          <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>📅 Haftalik hisobot</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('uz', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Haftada 1 ta hisobot majburiy · maksimum 3 ta.
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: weekCount >= 3 ? '#ef4444' : 'var(--accent)' }}>{weekCount}/3</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bu hafta yuborildi</p>
            </div>
          </div>
          {weekCount >= 3 && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-sm" style={{ color: '#ef4444' }}>Siz bu hafta 3 ta hisobot yubordingiz. Keyingi haftadan yana yuborishingiz mumkin.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">✅ Bu hafta nima bajardin?</label>
              <textarea
                value={form.completed}
                onChange={(e) => setForm({ ...form, completed: e.target.value })}
                className="input min-h-32 resize-none"
                placeholder="Asosiy yutuqlaringizni, erishilgan natijalar, chiqarilgan funksiyalar, jalb qilingan mijozlarni yozing..."
              />
            </div>

            <div>
              <label className="label">⚠️ Nima bajarilmadi? Barcha vazifalarni bajarishingizga nima xalaqit berdi?</label>
              <textarea
                value={form.notCompleted}
                onChange={(e) => setForm({ ...form, notCompleted: e.target.value })}
                className="input min-h-32 resize-none"
                placeholder="Rejalashtirilgan lekin bajarilmagan narsalar? Qanday to'siqlar bor edi? Halol bo'ling — bu menejeringizga sizga yordam berishga imkon beradi."
              />
            </div>

            <div>
              <label className="label">📋 Keyingi hafta rejangiz nima?</label>
              <textarea
                value={form.plans}
                onChange={(e) => setForm({ ...form, plans: e.target.value })}
                className="input min-h-32 resize-none"
                placeholder="Keyingi hafta uchun 3-5 ta asosiy vazifa. Maqsad va ko'rsatkichlar bilan aniq bo'ling."
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send size={16} /> Hisobot yuborish</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
