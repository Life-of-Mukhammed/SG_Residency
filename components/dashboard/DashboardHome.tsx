'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Rocket, Target, FileText, Calendar,
  CheckCircle, Clock, AlertCircle, ArrowRight, Users, DollarSign, Lock, Video
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

  const load = async () => {
    try {
      const [sr, rr, mr] = await Promise.all([
        axios.get('/api/startups?limit=1'),
        axios.get('/api/reports?limit=5'),
        axios.get('/api/meetings'),
      ]);
      const currentStartup = sr.data.startups?.[0] ?? null;
      setStartup(currentStartup);
      setReports(rr.data.reports  ?? []);
      setMeetings(mr.data.meetings ?? []);
      if (!currentStartup) {
        setShowApplyModal(true);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
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

    return (
      <>
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-16 px-8 relative overflow-hidden" style={{ background: 'radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(16,185,129,0.12), transparent 28%)' }}>
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
            {isRejected ? 'Arizangiz tasdiqlanmadi' : isInterviewStage ? 'Intervyu bosqichi faoldir' : 'Arizangiz ko\'rib chiqilmoqda'}
          </h2>
          <p className="text-sm max-w-xl mx-auto leading-6" style={{ color: 'var(--text-muted)' }}>
            {isRejected
              ? 'Arizangiz rad etildi. Rezidentlikka kirish ariza tasdiqlanguncha qulflangan bo\'lib qoladi.'
              : isInterviewStage
                ? 'Leadingiz birinchi tekshiruvdan o\'tdi. Hozircha faqat uchrashuvlar ochiq — jamoa bilan intervyu belgilashingiz mumkin.'
                : 'Arizangiz muvaffaqiyatli yuborildi. Menejer yoki admin ko\'rib chiqishi hali davom etmoqda.'}
          </p>

          {startup.rejectionReason && (
            <div
              className="mt-6 mx-auto max-w-xl rounded-2xl p-4 text-left"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left">
            <div className="card">
              <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Ariza
              </p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {startup.startup_name}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {startup.startup_sphere} · {startup.region}
              </p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Ish muhitiga kirish
              </p>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Lock size={16} />
                <span className="text-sm">
                  {isInterviewStage ? 'Hozirda faqat uchrashuvlar, profil va startup ma\'lumotlari ochiq.' : 'Sprint, GTM, hisobotlar va uchrashuvlar hali qulflangan.'}
                </span>
              </div>
            </div>
          </div>
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
          {isRejected && (
            <button className="btn-primary mt-8" onClick={() => setShowApplyModal(true)}>
              Arizani yangilash
            </button>
          )}
        </div>
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
