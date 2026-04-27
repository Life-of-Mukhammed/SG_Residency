'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { ArrowLeft, Globe, Users, DollarSign, Phone, MessageCircle, FileText, Calendar, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

export default function StartupDetailPage() {
  const { id } = useParams();
  const [startup, setStartup] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

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

  const openEdit = () => {
    setEditForm({
      startup_name: startup.startup_name || '',
      description: startup.description || '',
      startup_sphere: startup.startup_sphere || '',
      stage: startup.stage || 'idea',
      region: startup.region || '',
      founder_name: startup.founder_name || '',
      phone: startup.phone || '',
      telegram: startup.telegram || '',
      pitch_deck: startup.pitch_deck || '',
      resume_url: startup.resume_url || '',
      team_size: startup.team_size ?? 1,
      mrr: startup.mrr ?? 0,
      users_count: startup.users_count ?? 0,
      investment_raised: startup.investment_raised ?? 0,
      commitment: startup.commitment || 'full-time',
      acceptedAt: startup.acceptedAt ? new Date(startup.acceptedAt).toISOString().slice(0, 10) : '',
    });
    setEditModal(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await axios.patch(`/api/startups/${id}`, editForm);
      setStartup(res.data.startup);
      setEditModal(false);
      toast.success('Startup updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

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
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{startup.startup_name}</h2>
                  <span className={`badge badge-${startup.status}`}>{startup.status}</span>
                  <span className={`badge badge-${startup.stage}`}>{startup.stage}</span>
                </div>
                <button onClick={openEdit} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
                  <Edit2 size={13} /> Edit
                </button>
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

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-0 w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Edit Startup Data</h3>
              <button onClick={() => setEditModal(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                <XCircle size={16} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Startup Name', key: 'startup_name' },
                  { label: 'Founder Name', key: 'founder_name' },
                  { label: 'Region', key: 'region' },
                  { label: 'Phone', key: 'phone' },
                  { label: 'Telegram', key: 'telegram' },
                  { label: 'Pitch Deck URL', key: 'pitch_deck' },
                  { label: 'Resume URL', key: 'resume_url' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input
                      value={editForm[key] || ''}
                      onChange={(e) => setEditForm((p: any) => ({ ...p, [key]: e.target.value }))}
                      className="input"
                    />
                  </div>
                ))}
                <div>
                  <label className="label">Stage</label>
                  <select value={editForm.stage} onChange={(e) => setEditForm((p: any) => ({ ...p, stage: e.target.value }))} className="input">
                    {['idea', 'mvp', 'growth', 'scale'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Commitment</label>
                  <select value={editForm.commitment} onChange={(e) => setEditForm((p: any) => ({ ...p, commitment: e.target.value }))} className="input">
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                  </select>
                </div>
                {[
                  { label: 'MRR ($)', key: 'mrr' },
                  { label: 'Users', key: 'users_count' },
                  { label: 'Investment ($)', key: 'investment_raised' },
                  { label: 'Team Size', key: 'team_size' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type="number" min="0" value={editForm[key] ?? 0} onChange={(e) => setEditForm((p: any) => ({ ...p, [key]: Number(e.target.value) }))} className="input" />
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Accepted Date (qabul qilingan sana)</label>
                <input
                  type="date"
                  value={editForm.acceptedAt || ''}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, acceptedAt: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={editForm.description || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, description: e.target.value }))} className="input min-h-24 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3 justify-end" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Edit2 size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

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
