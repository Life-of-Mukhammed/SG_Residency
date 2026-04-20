'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import { FileText, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchReports = async () => {
    try {
      const res = await axios.get(`/api/reports${filter ? `?status=${filter}` : ''}`);
      setReports(res.data.reports || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'accepted') return <CheckCircle size={16} style={{ color: '#10b981' }} />;
    if (status === 'rejected') return <XCircle size={16} style={{ color: '#ef4444' }} />;
    return <Clock size={16} style={{ color: '#f59e0b' }} />;
  };

  return (
    <div className="animate-fade-in">
      <Header title="Weekly Reports" subtitle="Track your weekly progress submissions" />
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['', 'pending', 'accepted', 'rejected'].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-sm px-4 py-2 rounded-xl font-medium transition-all capitalize`}
                style={{ background: filter === s ? 'var(--accent)' : 'var(--bg-card)', color: filter === s ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {s || 'All'}
              </button>
            ))}
          </div>
          <Link href="/dashboard/reports/new">
            <button className="btn-primary flex items-center gap-2">
              <Plus size={16} /> New Report
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-16">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No reports yet</p>
            <p className="text-sm mt-2 mb-6" style={{ color: 'var(--text-muted)' }}>Submit your first weekly report</p>
            <Link href="/dashboard/reports/new">
              <button className="btn-primary">Submit Report</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r._id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={r.status} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        Week of {format(new Date(r.weekStart), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Submitted {format(new Date(r.createdAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className={`badge badge-${r.status} capitalize`}>{r.status}</span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: '#10b981' }}>✅ Completed</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.completed}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: '#f59e0b' }}>⚠️ Not Completed</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.notCompleted}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: '#6366f1' }}>📋 Next Week Plans</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.plans}</p>
                  </div>
                </div>

                {r.status === 'rejected' && r.rejectionReason && (
                  <div className="mt-3 p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#ef4444' }}>Rejection Reason</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{r.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
