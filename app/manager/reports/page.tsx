'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Filter } from 'lucide-react';

export default function ManagerReportsPage() {
  const [reports, setReports]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/reports${filter ? `?status=${filter}` : ''}&limit=50`);
      setReports(res.data.reports ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, status: 'accepted' | 'rejected', rejectionReason?: string) => {
    setSubmitting(true);
    try {
      await axios.patch(`/api/reports/${id}`, { status, rejectionReason });
      toast.success(status === 'accepted' ? 'Hisobot qabul qilindi' : 'Hisobot rad etildi');
      setRejectId(null);
      setReason('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally { setSubmitting(false); }
  };

  const counts = {
    all:      reports.length,
    pending:  reports.filter(r => r.status === 'pending').length,
    accepted: reports.filter(r => r.status === 'accepted').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="animate-fade-in">
      <Header title="Hisobotlarni ko‘rib chiqish" subtitle="Asoschilarning haftalik hisobotlarini tekshiring va tasdiqlang" />
      <div className="p-8 space-y-6">

        {/* Filters + stats */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {(['pending','accepted','rejected',''] as const).map(s => (
              <button
                key={s || 'all'}
                onClick={() => setFilter(s)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
                style={{
                  background: filter === s ? 'var(--accent)' : 'var(--bg-card)',
                  color:      filter === s ? 'white'         : 'var(--text-muted)',
                  border:     '1px solid var(--border)',
                }}
              >
                {s === 'pending' ? 'Kutilmoqda' : s === 'accepted' ? 'Qabul qilingan' : s === 'rejected' ? 'Rad etilgan' : 'Barchasi'} {s === 'pending' && counts.pending > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-white/20">
                    {counts.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Yangilash
          </button>
        </div>

        {/* Reports */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-16">
            <Filter size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Hisobot topilmadi</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {filter === 'pending' ? 'Kutilayotgan hisobot yo‘q.' : 'Bu saralashga mos hisobot yo‘q.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r._id} className="card">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {r.status === 'accepted' ? (
                      <CheckCircle size={18} style={{ color: '#10b981' }} />
                    ) : r.status === 'rejected' ? (
                      <XCircle size={18} style={{ color: '#ef4444' }} />
                    ) : (
                      <Clock size={18} style={{ color: '#f59e0b' }} />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {r.startupId?.startup_name ?? 'Nomaʼlum startup'}
                        </p>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {r.userId?.name} {r.userId?.surname}
                        </p>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.weekStart).toLocaleDateString('uz')} haftasi ·
                        {new Date(r.createdAt).toLocaleString('uz')} yuborilgan
                      </p>
                    </div>
                  </div>
                  <span className={`badge badge-${r.status} capitalize flex-shrink-0`}>{r.status}</span>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: '#10b981' }}>Bajarildi</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.completed}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: '#f59e0b' }}>Bajarilmadi</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.notCompleted}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: '#6366f1' }}>Keyingi hafta</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.plans}</p>
                  </div>
                </div>

                {/* Rejection reason */}
                {r.status === 'rejected' && r.rejectionReason && (
                  <div className="flex items-start gap-2 p-3 rounded-xl mb-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>Rad etish sababi</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{r.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => review(r._id, 'accepted')}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                    >
                      <CheckCircle size={14} /> Qabul qilish
                    </button>
                    <button
                      onClick={() => { setRejectId(r._id); setReason(''); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                    >
                      <XCircle size={14} /> Rad etish
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rad etish oynasi */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Hisobotni rad etish</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Asoschi keyingi haftada yaxshilashi uchun aniq sabab yozing.
            </p>
            <label className="label">Rad etish sababi *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="input min-h-28 resize-none mb-6"
              placeholder="Masalan: hisobotda aniq ko‘rsatkichlar yetishmayapti, keyingi safar daromad va o‘sish raqamlarini kiriting."
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)} className="btn-secondary flex-1">Bekor qilish</button>
              <button
                onClick={() => reason.trim() && review(rejectId, 'rejected', reason)}
                disabled={!reason.trim() || submitting}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Hisobotni rad etish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
