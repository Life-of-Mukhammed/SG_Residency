'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Rocket, Target, FileText, Calendar,
  CheckCircle, Clock, AlertCircle, ArrowRight, Users, DollarSign, Video,
  Send, Smartphone, Edit3, Download, Star,
} from 'lucide-react';
import ResidencyApplicationModal from '@/components/dashboard/ResidencyApplicationModal';

export default function DashboardHome() {
  const { data: session } = useSession();
  const router = useRouter();
  const [startup, setStartup]   = useState<any>(null);
  const [reports, setReports]   = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [telegramConnect, setTelegramConnect] = useState<{ startLink: string | null; code: string | null; botUsername: string | null }>({
    startLink: null, code: null, botUsername: null,
  });
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [adSettings, setAdSettings] = useState<{
    title: string; description: string; bannerImage: string;
    websiteUrl: string; appStoreUrl: string; googlePlayUrl: string; enabled: boolean;
  } | null>(null);

  const load = async () => {
    try {
      const [sr, rr, mr, pr] = await Promise.all([
        axios.get('/api/startups?limit=1'),
        axios.get('/api/reports?limit=5'),
        axios.get('/api/meetings'),
        axios.get('/api/profile').catch(() => ({ data: { user: null } })),
      ]);
      const currentStartup = sr.data.startups?.[0] ?? null;
      setStartup(currentStartup);
      setReports(rr.data.reports  ?? []);
      setMeetings(mr.data.meetings ?? []);
      if (pr.data?.user?.telegramChatId) setTelegramConnected(true);
      if (!currentStartup) {
        setShowApplyModal(true);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    axios.get('/api/telegram/connect').then((r) => setTelegramConnect(r.data)).catch(() => {});
    axios.get('/api/ad-settings').then((r) => setAdSettings(r.data.settings)).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('apply') === '1') {
      setShowApplyModal(true);
    }
  }, []);

  useEffect(() => {
    if (!startup?._id || startup.status !== 'lead_accepted' || typeof window === 'undefined') return;

    const promptKey = `interview_prompt_seen_${startup._id}_${startup.status}`;
    const alreadySeen = window.localStorage.getItem(promptKey);

    if (!alreadySeen) {
      setShowInterviewModal(true);
      window.localStorage.setItem(promptKey, '1');
    }
  }, [startup?._id, startup?.status]);

  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'booked' && new Date(m.scheduledAt) > new Date()
  );
  const lastReport = reports[0];
  const isApproved = startup?.status === 'active';
  const isInterviewStage = startup?.status === 'lead_accepted';
  const upcomingInterviewMeetings = upcomingMeetings;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-36" />
        ))}
      </div>
    );
  }

  if (startup && startup.status !== 'active') {
    const isRejected = startup.status === 'rejected';
    const isPending  = startup.status === 'pending';

    return (
      <>
      <div className="max-w-2xl mx-auto space-y-5 pb-8">

        {/* Asosiy holat kartasi */}
        <div
          className="card text-center py-12 px-8 relative overflow-hidden"
          style={{
            background: 'radial-gradient(circle at top left, rgba(99,102,241,0.12), transparent 30%), radial-gradient(circle at bottom right, rgba(16,185,129,0.08), transparent 30%)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: isRejected ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.14)' }}
          >
            {isRejected ? (
              <AlertCircle size={28} style={{ color: '#ef4444' }} />
            ) : (
              <Clock size={28} style={{ color: '#f59e0b' }} />
            )}
          </div>

          <span className={`badge ${isRejected ? 'badge-rejected' : 'badge-pending'} mb-4`}>
            {isRejected ? 'Rad etilgan' : isInterviewStage ? 'Intervyu bosqichi' : 'Ko\'rib chiqilmoqda'}
          </span>

          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {isRejected
              ? 'Arizangiz tasdiqlanmadi'
              : isInterviewStage
                ? 'Intervyu bosqichi faoldir'
                : 'Arizangiz ko\'rib chiqilmoqda'}
          </h2>

          <p className="text-sm max-w-lg mx-auto leading-6" style={{ color: 'var(--text-muted)' }}>
            {isRejected
              ? 'Arizangiz rad etildi. Tahrirlash imkoniyatidan foydalanib qayta yuboring.'
              : isInterviewStage
                ? 'Leadingiz birinchi tekshiruvdan o\'tdi. Hozircha faqat uchrashuvlar ochiq.'
                : 'Arizangiz muvaffaqiyatli yuborildi. Menejer yoki admin ko\'rib chiqishi davom etmoqda.'}
          </p>

          {/* Rad etish sababi */}
          {startup.rejectionReason && (
            <div
              className="mt-6 mx-auto max-w-lg rounded-2xl p-4 text-left"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
            >
              <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: '#ef4444' }}>
                Rad etish sababi
              </p>
              <p className="text-sm leading-6" style={{ color: 'var(--text-primary)' }}>
                {startup.rejectionReason}
              </p>
            </div>
          )}

          {/* Startup ma'lumotlari */}
          <div
            className="mt-6 rounded-2xl p-4 text-left"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-muted)' }}>Ariza</p>
            <p className="text-lg font-semibold notranslate" translate="no" style={{ color: 'var(--text-primary)' }}>
              {startup.startup_name}
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {startup.startup_sphere} · {startup.region}
            </p>
          </div>

          {/* Tugmalar */}
          {(isPending || isRejected) && (
            <button
              className="btn-primary mt-6 inline-flex items-center gap-2"
              onClick={() => setShowApplyModal(true)}
            >
              <Edit3 size={15} /> Arizani tahrirlash
            </button>
          )}

          {isInterviewStage && (
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Link href="/dashboard/meetings">
                <button className="btn-primary">Uchrashuvlarni ochish</button>
              </Link>
              <button className="btn-secondary" onClick={() => setShowInterviewModal(true)}>
                Intervyu oynasini ko&apos;rish
              </button>
            </div>
          )}
        </div>

        {/* Telegram bildirishnomalar */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,136,204,0.12)' }}
            >
              <Send size={20} style={{ color: '#0088cc' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Telegram bildirishnomalar</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {telegramConnected
                  ? 'Telegram ulangan — ariza yangilanishi haqida darhol xabardor bo\'lasiz'
                  : 'Ariza natijasi haqida darhol Telegram orqali xabardor bo\'ling'}
              </p>
            </div>
            {telegramConnected ? (
              <span
                className="text-xs px-3 py-1.5 rounded-xl font-semibold flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
              >
                Ulangan
              </span>
            ) : telegramConnect.startLink ? (
              <a
                href={telegramConnect.startLink}
                target="_blank"
                rel="noreferrer"
                className="btn-primary flex-shrink-0 flex items-center gap-2 text-sm"
              >
                <Send size={14} /> Ulash
              </a>
            ) : (
              <Link href="/dashboard/settings" className="flex-shrink-0">
                <button className="btn-secondary text-sm">Sozlamalar</button>
              </Link>
            )}
          </div>
        </div>

        {/* Founders School reklama - dinamik */}
        {adSettings?.enabled !== false && (
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.12) 50%, rgba(16,185,129,0.08) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            {adSettings?.bannerImage && (
              <img
                src={adSettings.bannerImage}
                alt="Banner"
                className="w-full object-cover"
                style={{ maxHeight: 180, display: 'block' }}
              />
            )}
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4 mb-5">
                {!adSettings?.bannerImage && (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  >
                    <Smartphone size={24} style={{ color: '#fff' }} />
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--accent)' }}>Mobil dastur</p>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {adSettings?.title || 'Founders School'}
                  </h3>
                  <p className="text-sm mt-1 leading-5" style={{ color: 'var(--text-muted)' }}>
                    {adSettings?.description || 'Bo\'lajak asoschilarga kerak bo\'lgan barcha bilimlar bir joyda jamlandi'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                ))}
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>App Store & Google Play</span>
              </div>

              <div className="flex flex-wrap gap-3">
                {adSettings?.websiteUrl && (
                  <a href={adSettings.websiteUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    <Download size={15} /> Saytga o'tish
                  </a>
                )}
                {adSettings?.appStoreUrl && (
                  <a href={adSettings.appStoreUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    App Store
                  </a>
                )}
                {adSettings?.googlePlayUrl && (
                  <a href={adSettings.googlePlayUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.18 23.76c.33.18.71.2 1.07.04l12.2-6.87-2.68-2.69-10.59 9.52zm-1.12-20.3C2 3.64 2 3.87 2 4.1v15.8c0 .23 0 .46.06.64l.09.09L14.64 8.1l-.09-.09-12.59-4.55zM20.47 10.3l-2.4-1.36-2.97 2.98 2.97 2.98 2.4-1.36c.68-.38 1.13-.96 1.13-1.62s-.45-1.24-1.13-1.62zM4.25.24C3.89.08 3.51.1 3.18.28L13.77 11l2.68-2.69L4.25.24z"/>
                    </svg>
                    Google Play
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      <ResidencyApplicationModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmitted={load}
        startup={startup}
      />
      </>
    );
  }

  return (
    <>
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Rocket size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <span className={`badge badge-${startup?.status || 'pending'}`}>
              {startup?.status || 'startup yo\'q'}
            </span>
          </div>
          <p className="text-2xl font-bold notranslate" translate="no" style={{ color: 'var(--text-primary)' }}>
            {startup?.startup_name || '—'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {startup?.startup_sphere || 'Ariza topshiring'}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <DollarSign size={18} style={{ color: '#10b981' }} />
            </div>
            <span className={`badge badge-${startup?.stage || 'idea'}`}>
              {startup?.stage || 'idea'}
            </span>
          </div>
          <p className="text-2xl font-bold notranslate" translate="no" style={{ color: 'var(--text-primary)' }}>
            ${startup?.mrr?.toLocaleString() || '0'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Oylik takroriy daromad</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Users size={18} style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <p className="text-2xl font-bold notranslate" translate="no" style={{ color: 'var(--text-primary)' }}>
            {startup?.users_count?.toLocaleString() || '0'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Jami foydalanuvchilar</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(236,72,153,0.15)' }}>
              <FileText size={18} style={{ color: '#ec4899' }} />
            </div>
            <span className={`badge badge-${lastReport?.status || 'pending'}`}>
              {lastReport?.status || 'yo\'q'}
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {reports.length}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Haftalik hisobotlar</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Tezkor amallar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!startup ? (
            <Link href="/dashboard/apply">
              <div className="card cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Rocket size={22} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Rezidentlikka ariza topshirish</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Rezidentlikka arizangizni boshlang</p>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }}
                    className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ) : isApproved ? (
            <Link href="/dashboard/sprint">
              <div className="card cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Target size={22} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sprint vazifalari</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Yo&apos;l xaritasi bo&apos;yicha progressingizni kuzating</p>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }}
                    className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="card" style={{ borderStyle: 'dashed' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <Target size={22} style={{ color: '#f59e0b' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sprint rezidentlik tasdiqlangandan keyin ochiladi</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sprint ochilishi uchun menejer yoki admin tasdigi kerak.</p>
                </div>
              </div>
            </div>
          )}

          <Link href={isApproved ? "/dashboard/reports/new" : "/dashboard/settings"}>
            <div className="card cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <FileText size={22} style={{ color: '#10b981' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{isApproved ? 'Hisobot yuborish' : 'Hisobotlar qulflangan'}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isApproved ? 'Haftalik progress yangilanishi' : 'Haftalik hisobotlar uchun tasdiq kerak'}</p>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }}
                  className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href={isApproved ? "/dashboard/meetings" : "/dashboard/settings"}>
            <div className="card cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <Calendar size={22} style={{ color: '#f59e0b' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{isApproved ? 'Uchrashuv belgilash' : 'Uchrashuvlar qulflangan'}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isApproved ? 'Menejer bilan vaqt belgilang' : 'Bron qilish uchun tasdiq kerak'}</p>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }}
                  className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>So&apos;nggi hisobotlar</h3>
            <Link href="/dashboard/reports">
              <button className="text-xs" style={{ color: 'var(--accent)' }}>Hammasini ko&apos;rish →</button>
            </Link>
          </div>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hali hisobotlar yo&apos;q</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 4).map((r) => (
                <div key={r._id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-3">
                    {r.status === 'accepted' ? (
                      <CheckCircle size={16} style={{ color: '#10b981' }} />
                    ) : r.status === 'rejected' ? (
                      <AlertCircle size={16} style={{ color: '#ef4444' }} />
                    ) : (
                      <Clock size={16} style={{ color: '#f59e0b' }} />
                    )}
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date(r.weekStart).toLocaleDateString('uz', { month: 'long', day: 'numeric' })} hafta
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString('uz')}
                      </p>
                    </div>
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Kelgusi uchrashuvlar</h3>
            <Link href="/dashboard/meetings">
              <button className="text-xs" style={{ color: 'var(--accent)' }}>Hammasini ko&apos;rish →</button>
            </Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kelgusi uchrashuvlar yo&apos;q</p>
              <Link href="/dashboard/meetings">
                <button className="btn-primary mt-3 text-xs">Uchrashuv belgilash</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.slice(0, 4).map((m) => (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.15)' }}>
                      <Calendar size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(m.scheduledAt).toLocaleString('uz', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <a href={m.meetLink} target="_blank" rel="noreferrer">
                    <button className="btn-primary text-xs py-1.5">Havolani ochish</button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    <ResidencyApplicationModal
      open={showApplyModal}
      onClose={() => setShowApplyModal(false)}
      onSubmitted={load}
      lockOpen={!startup}
    />
    {isInterviewStage && showInterviewModal && (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style={{ background: 'rgba(2,6,23,0.78)', backdropFilter: 'blur(10px)' }}
      >
        <div className="card w-full max-w-2xl px-7 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
                Intervyu uchun kirish
              </p>
              <h3 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                Menejer intervyu bosqichini tasdiqladi
              </h3>
              <p className="text-sm mt-3 leading-6" style={{ color: 'var(--text-muted)' }}>
                Arizangiz birinchi tekshiruvdan o&apos;tdi. Endi uchrashuv kalendarini ochib, menejer bilan intervyu belgilashingiz mumkin.
              </p>
            </div>
            <button
              onClick={() => setShowInterviewModal(false)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <AlertCircle size={18} style={{ opacity: 0.55 }} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="rounded-3xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Video size={18} style={{ color: 'var(--accent)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Uchrashuvlar kalendari</p>
              </div>
              <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                Mavjud sana va vaqt tanlab broning. Brondan so&apos;ng intervyu havolasi yoki ofis manzili uchrashuvlar bo&apos;limida ko&apos;rinadi.
              </p>
              <button
                className="btn-primary mt-5 w-full"
                onClick={() => {
                  setShowInterviewModal(false);
                  router.push('/dashboard/meetings');
                }}
              >
                Uchrashuvlar kalendarini ochish
              </button>
            </div>

            <div className="rounded-3xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} style={{ color: 'var(--accent)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Kelgusi intervyu</p>
              </div>
              {upcomingInterviewMeetings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingInterviewMeetings.slice(0, 2).map((meeting) => (
                    <div key={meeting._id} className="rounded-2xl p-3" style={{ background: 'var(--bg-card)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date(meeting.scheduledAt).toLocaleString('uz', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {meeting.topic || 'Intervyu uchrashivi'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                  Hali intervyu bronlanmagan. Uchrashuvlar kalendarini oching va vaqt tanlang.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
