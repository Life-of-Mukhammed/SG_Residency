'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/dashboard/Header';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Users, Rocket, FileText, Calendar, TrendingUp, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/analytics').then((res) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

  const stageMap: Record<string, string> = { idea: '💡 Idea', mvp: '🚀 MVP', growth: '📈 Growth', scale: '⚡ Scale' };

  if (loading) return (
    <div>
      <Header title="Analytics" subtitle="System-wide insights" />
      <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
      </div>
    </div>
  );

  const stageData = (data?.stageStats || []).map((s: any) => ({
    name: stageMap[s._id] || s._id,
    value: s.count,
  }));

  const sphereData = (data?.sphereStats || []).map((s: any) => ({
    name: s._id,
    count: s.count,
  }));

  const growthChange = data?.newLastMonth > 0
    ? Math.round(((data.newThisMonth - data.newLastMonth) / data.newLastMonth) * 100)
    : data?.newThisMonth > 0 ? 100 : 0;

  return (
    <div className="animate-fade-in">
      <Header title="Analytics" subtitle="System-wide performance insights" />
      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Startups', value: data?.totalStartups, icon: <Rocket size={20} />, color: '#6366f1', sub: `${data?.newThisMonth} this month` },
            { label: 'Active Startups', value: data?.activeStartups, icon: <Activity size={20} />, color: '#10b981', sub: `${data?.inactiveStartups} inactive` },
            { label: 'Total Reports', value: data?.totalReports, icon: <FileText size={20} />, color: '#f59e0b', sub: `${data?.pendingReports} pending review` },
            { label: 'Meetings Held', value: data?.totalMeetings, icon: <Calendar size={20} />, color: '#ec4899', sub: 'Total booked' },
            { label: 'Registered Users', value: data?.totalUsers, icon: <Users size={20} />, color: '#8b5cf6', sub: 'Founders' },
            { label: 'Task Completion', value: `${data?.taskCompletionRate}%`, icon: <TrendingUp size={20} />, color: '#3b82f6', sub: 'Sprint progress' },
            { label: 'New This Month', value: data?.newThisMonth, icon: <Rocket size={20} />, color: '#14b8a6', sub: `vs ${data?.newLastMonth} last month` },
            { label: 'Pending Review', value: data?.pendingStartups, icon: <Activity size={20} />, color: '#f59e0b', sub: 'Awaiting approval' },
          ].map(({ label, value, icon, color, sub }) => (
            <div key={label} className="card">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}22`, color }}>
                {icon}
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Growth */}
          <div className="card">
            <h3 className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Monthly Startup Growth</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data?.monthlyGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e2e8f0' }}
                  cursor={{ stroke: 'rgba(99,102,241,0.3)' }}
                />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} name="New Startups" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stage Distribution */}
          <div className="card">
            <h3 className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Stage Distribution</h3>
            {stageData.length === 0 ? (
              <div className="flex items-center justify-center h-60" style={{ color: 'var(--text-muted)' }}>No data yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={stageData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                      {stageData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {stageData.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Spheres */}
          <div className="card">
            <h3 className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Top Industries</h3>
            {sphereData.length === 0 ? (
              <div className="flex items-center justify-center h-60" style={{ color: 'var(--text-muted)' }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sphereData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e2e8f0' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} name="Startups">
                    {sphereData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status Overview */}
          <div className="card">
            <h3 className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Status Overview</h3>
            <div className="space-y-4">
              {[
                { label: 'Active', value: data?.activeStartups, total: data?.totalStartups, color: '#10b981' },
                { label: 'Pending', value: data?.pendingStartups, total: data?.totalStartups, color: '#f59e0b' },
                { label: 'Inactive', value: data?.inactiveStartups, total: data?.totalStartups, color: '#64748b' },
              ].map(({ label, value, total, color }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span></span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Report Status</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Reports', value: data?.totalReports, color: '#6366f1' },
                  { label: 'Pending Review', value: data?.pendingReports, color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Growth Summary */}
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Growth Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>New startups this month</p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{data?.newThisMonth}</p>
              <p className="text-xs mt-1" style={{ color: growthChange >= 0 ? '#10b981' : '#ef4444' }}>
                {growthChange >= 0 ? '↑' : '↓'} {Math.abs(growthChange)}% vs last month
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sprint completion rate</p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{data?.taskCompletionRate}%</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Across all startups</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Active rate</p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {data?.totalStartups > 0 ? Math.round((data.activeStartups / data.totalStartups) * 100) : 0}%
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Of total startups</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
