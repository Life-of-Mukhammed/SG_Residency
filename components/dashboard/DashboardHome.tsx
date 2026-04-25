'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import {
  Rocket, Target, FileText, Calendar,
  CheckCircle, Clock, AlertCircle, ArrowRight, Users, DollarSign, Lock
} from 'lucide-react';

export default function DashboardHome() {
  const { data: session } = useSession();
  const [startup, setStartup]   = useState<any>(null);
  const [reports, setReports]   = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sr, rr, mr] = await Promise.all([
          axios.get('/api/startups?limit=1'),
          axios.get('/api/reports?limit=5'),
          axios.get('/api/meetings'),
        ]);
        setStartup(sr.data.startups?.[0] ?? null);
        setReports(rr.data.reports  ?? []);
        setMeetings(mr.data.meetings ?? []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'booked' && new Date(m.scheduledAt) > new Date()
  );
  const lastReport = reports[0];
  const isApproved = startup?.status === 'active';

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
      <div className="max-w-3xl mx-auto">
        <div className="card text-center py-16 px-8">
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
            {isRejected ? 'Rejected' : 'On Progress'}
          </span>
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {isRejected ? 'Your application was rejected' : 'Your application is on progress'}
          </h2>
          <p className="text-sm max-w-xl mx-auto leading-6" style={{ color: 'var(--text-muted)' }}>
            {isRejected
              ? 'Admin yoki manager sizning arizangizni rad etdi. Dashboard approval bo‘lmaguncha ochilmaydi.'
              : 'Arizangiz yuborildi. Hozircha lead sifatida ko‘rib chiqilyapsiz. Admin yoki manager accept qilgandan keyin dashboard to‘liq ochiladi.'}
          </p>

          {startup.rejectionReason && (
            <div
              className="mt-6 mx-auto max-w-xl rounded-2xl p-4 text-left"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
            >
              <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: '#ef4444' }}>
                Reject Reason
              </p>
              <p className="text-sm leading-6" style={{ color: 'var(--text-primary)' }}>
                {startup.rejectionReason}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left">
            <div className="card">
              <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Lead
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
                Workspace Access
              </p>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Lock size={16} />
                <span className="text-sm">Sprint, GTM, reports va meetings hozircha yopiq</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Rocket size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <span className={`badge badge-${startup?.status || 'pending'}`}>
              {startup?.status || 'no startup'}
            </span>
          </div>
          <p className="text-2xl font-bold notranslate" translate="no" style={{ color: 'var(--text-primary)' }}>
            {startup?.startup_name || '—'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {startup?.startup_sphere || 'Submit application'}
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
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Monthly Recurring Revenue</p>
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
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Total Users</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(236,72,153,0.15)' }}>
              <FileText size={18} style={{ color: '#ec4899' }} />
            </div>
            <span className={`badge badge-${lastReport?.status || 'pending'}`}>
              {lastReport?.status || 'none'}
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {reports.length}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Weekly Reports</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Quick Actions
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
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Apply to Residency</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Submit your startup application</p>
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
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sprint Tasks</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track your roadmap progress</p>
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
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sprint unlocks after approval</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manager or admin approval is required before sprint opens.</p>
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
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{isApproved ? 'Submit Report' : 'Reports locked'}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isApproved ? 'Weekly progress update' : 'Approval is required before weekly reports'}</p>
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
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{isApproved ? 'Book Meeting' : 'Meetings locked'}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isApproved ? 'Schedule with your manager' : 'Approval is required before booking'}</p>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }}
                  className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Reports</h3>
            <Link href="/dashboard/reports">
              <button className="text-xs" style={{ color: 'var(--accent)' }}>View all →</button>
            </Link>
          </div>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reports yet</p>
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
                        Week of {new Date(r.weekStart).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Upcoming Meetings</h3>
            <Link href="/dashboard/meetings">
              <button className="text-xs" style={{ color: 'var(--accent)' }}>View all →</button>
            </Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming meetings</p>
              <Link href="/dashboard/meetings">
                <button className="btn-primary mt-3 text-xs">Book a meeting</button>
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
                        {new Date(m.scheduledAt).toLocaleString('en', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <a href={m.meetLink} target="_blank" rel="noreferrer">
                    <button className="btn-primary text-xs py-1.5">Open Link</button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
