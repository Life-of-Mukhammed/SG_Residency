'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { ArrowLeft, Globe, Users, DollarSign, Phone, MessageCircle, FileText, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function StartupDetailPage() {
  const { id } = useParams();
  const [startup, setStartup] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sRes, rRes, mRes] = await Promise.all([
          axios.get(`/api/startups/${id}`),
          axios.get('/api/reports'),
          axios.get('/api/meetings'),
        ]);
        setStartup(sRes.data.startup);
        setReports((rRes.data.reports || []).filter((r: any) => r.startupId?._id === id || r.startupId === id));
        setMeetings((mRes.data.meetings || []).filter((m: any) => m.startupId?._id === id || m.startupId === id));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (id) fetchAll();
  }, [id]);

  const reviewReport = async (reportId: string, status: 'accepted' | 'rejected', reason?: string) => {
    try {
      await axios.patch(`/api/reports/${reportId}`, { status, rejectionReason: reason });
      toast.success(`Report ${status}`);
      setRejectModal(null);
      setRejectReason('');
      const rRes = await axios.get('/api/reports');
      setReports((rRes.data.reports || []).filter((r: any) => r.startupId?._id === id || r.startupId === id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update report');
    }
  };

  if (loading) return (
    <div>
      <Header title="Startup Detail" />
      <div className="p-8 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32" />)}</div>
    </div>
  );

  if (!startup) return (
    <div>
      <Header title="Not Found" />
      <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Startup not found</div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <Header title={startup.startup_name} subtitle={`${startup.startup_sphere} · ${startup.region}`} />
      <div className="p-8 space-y-6">
        <Link href="/manager">
          <button className="btn-secondary flex items-center gap-2 text-sm mb-2">
            <ArrowLeft size={14} /> Back to Manager Panel
          </button>
        </Link>

        {/* Hero card */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {startup.startup_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{startup.startup_name}</h2>
                <span className={`badge badge-${startup.status}`}>{startup.status}</span>
                <span className={`badge badge-${startup.stage}`}>{startup.stage}</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{startup.description}</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={14} /> {startup.phone}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <MessageCircle size={14} /> {startup.telegram}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Globe size={14} /> {startup.gmail}
                </div>
                {startup.pitch_deck && (
                  <a href={startup.pitch_deck} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent)' }}>
                    <FileText size={14} /> Pitch Deck
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'MRR', value: `$${startup.mrr?.toLocaleString()}`, icon: <DollarSign size={18} />, color: '#10b981' },
            { label: 'Users', value: startup.users_count?.toLocaleString(), icon: <Users size={18} />, color: '#6366f1' },
            { label: 'Investment', value: `$${startup.investment_raised?.toLocaleString()}`, icon: <DollarSign size={18} />, color: '#f59e0b' },
            { label: 'Team Size', value: startup.team_size, icon: <Users size={18} />, color: '#ec4899' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}22`, color }}>
                {icon}
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Reports */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={18} style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly Reports ({reports.length})</h3>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No reports submitted yet</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r._id} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {r.status === 'accepted' ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : r.status === 'rejected' ? <XCircle size={16} style={{ color: '#ef4444' }} /> : <Clock size={16} style={{ color: '#f59e0b' }} />}
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Week of {format(new Date(r.weekStart), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => reviewReport(r._id, 'accepted')} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            Accept
                          </button>
                          <button onClick={() => setRejectModal(r._id)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><p className="font-medium mb-1" style={{ color: '#10b981' }}>✅ Done</p><p style={{ color: 'var(--text-secondary)' }}>{r.completed}</p></div>
                    <div><p className="font-medium mb-1" style={{ color: '#f59e0b' }}>⚠️ Not Done</p><p style={{ color: 'var(--text-secondary)' }}>{r.notCompleted}</p></div>
                    <div><p className="font-medium mb-1" style={{ color: '#6366f1' }}>📋 Next Week</p><p style={{ color: 'var(--text-secondary)' }}>{r.plans}</p></div>
                  </div>
                  {r.rejectionReason && (
                    <div className="mt-3 p-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                      Rejection: {r.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meetings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={18} style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Meetings ({meetings.length})</h3>
          </div>
          {meetings.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No meetings recorded</p>
          ) : (
            <div className="space-y-2">
              {meetings.map((m) => (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(m.scheduledAt), 'MMM d, yyyy · h:mm a')} · {m.topic || 'No topic'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${m.status}`}>{m.status}</span>
                    <a href={m.meetLink} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>Join</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Reject Report</h3>
            <div className="mb-6">
              <label className="label">Reason for rejection *</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input min-h-24 resize-none" placeholder="Explain why this report is being rejected and what the founder should improve..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => rejectReason.trim() && reviewReport(rejectModal, 'rejected', rejectReason)} className="btn-danger flex-1">Reject Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
