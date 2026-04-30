'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/dashboard/Header';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import {
  Users, Rocket, FileText, Calendar, TrendingUp, Activity, Award, MapPin, DollarSign, Layers,
} from 'lucide-react';

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
      <Header title="Tahlillar" subtitle="Rezidentlar bo‘yicha ko‘rsatkichlar" />
      <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
      </div>
    </div>
  );

  const stageData = (data?.stageStats || []).map((s: any) => ({
    name: stageMap[s._id] || s._id,
    value: s.count,
  }));

  const regionData = (data?.regionStats || []).map((s: any) => ({
    name: s._id || '—',
    count: s.count,
  }));

  const sphereData = (data?.sphereStats || []).map((s: any) => ({
    name: s._id || '—',
    count: s.count,
  }));

  const growthChange = data?.newResidentsLastMonth > 0
    ? Math.round(((data.newResidentsThisMonth - data.newResidentsLastMonth) / data.newResidentsLastMonth) * 100)
    : data?.newResidentsThisMonth > 0 ? 100 : 0;

  const totals = data?.residentTotals || {};
  const totalResidents = data?.totalResidents ?? 0;

  const fmtMoney = (n: number) => {
    if (!n) return '$0';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n}`;
  };

  return (
    <div className="animate-fade-in">
      <Header title="Tahlillar" subtitle="Rezidentlar bo‘yicha real ko‘rsatkichlar" />
      <div className="p-8 space-y-8">
        {/* KPI Cards — resident-centric */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Jami rezidentlar',  value: data?.totalResidents,           icon: <Users size={20} />,      color: '#10b981', sub: `${data?.newResidentsThisMonth ?? 0} ta shu oy` },
            { label: 'Eng faol oy',       value: data?.bestMonth?.count ?? 0,    icon: <Award size={20} />,      color: '#f59e0b', sub: data?.bestMonth?.month || '—' },
            { label: 'Yetakchi soha',     value: data?.topSphere || '—',          icon: <Layers size={20} />,     color: '#6366f1', sub: 'eng ko‘p rezident', big: false },
            { label: 'Yetakchi hudud',    value: data?.topRegion || '—',          icon: <MapPin size={20} />,     color: '#8b5cf6', sub: 'eng ko‘p rezident', big: false },
            { label: 'Jami MRR',          value: fmtMoney(totals.totalMrr || 0), icon: <DollarSign size={20} />, color: '#ec4899', sub: 'rezidentlar bo‘yicha', big: false },
            { label: 'Jami foydalanuv.',  value: (totals.totalUsers || 0).toLocaleString(), icon: <Users size={20} />, color: '#3b82f6', sub: 'rezidentlar bo‘yicha', big: false },
            { label: 'Investitsiya',      value: fmtMoney(totals.totalInvestment || 0), icon: <TrendingUp size={20} />, color: '#14b8a6', sub: 'jamlangan', big: false },
            { label: 'Vazifa bajarilishi', value: `${data?.taskCompletionRate ?? 0}%`,   icon: <Activity size={20} />,    color: '#ef4444', sub: 'sprint natijasi' },
          ].map(({ label, value, icon, color, sub, big = true }) => (
            <div key={label} className="card">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}22`, color }}>
                {icon}
              </div>
              <p className={big ? 'text-2xl font-bold' : 'text-base font-bold truncate'} style={{ color: 'var(--text-primary)' }}>
                {value ?? '—'}
              </p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Monthly Residents (12 months) — area chart */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Oylik rezidentlar dinamikasi</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>So‘nggi 12 oy ichida qaysi oyda nechta rezident qabul qilingan</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                Eng faol oy: <strong>{data?.bestMonth?.month}</strong> ({data?.bestMonth?.count} ta)
              </div>
              <div className="px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>
                Shu oy: <strong>{data?.newResidentsThisMonth ?? 0}</strong>
                <span className="ml-1" style={{ color: growthChange >= 0 ? '#10b981' : '#ef4444' }}>
                  {growthChange >= 0 ? '↑' : '↓'} {Math.abs(growthChange)}%
                </span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data?.monthlyResidents || []}>
              <defs>
                <linearGradient id="residentsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a35', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, color: '#e2e8f0' }}
                cursor={{ stroke: 'rgba(16,185,129,0.3)' }}
                formatter={(v: any) => [`${v} ta rezident`, '']}
              />
              <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} fill="url(#residentsArea)" name="Rezidentlar" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Row — Sphere + Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sphere — top spheres among residents */}
          <div className="card">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Sohalar bo‘yicha rezidentlar</h3>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Qaysi sohada eng ko‘p rezident bor</p>
            {sphereData.length === 0 ? (
              <div className="flex items-center justify-center h-60" style={{ color: 'var(--text-muted)' }}>Hali rezident yo‘q</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sphereData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e2e8f0' }}
                    formatter={(v: any) => [`${v} rezident`, '']} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Rezidentlar">
                    {sphereData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stage Distribution — residents only */}
          <div className="card">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Bosqichlar bo‘yicha rezidentlar</h3>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Idea, MVP, Growth, Scale taqsimoti</p>
            {stageData.length === 0 ? (
              <div className="flex items-center justify-center h-60" style={{ color: 'var(--text-muted)' }}>Hali rezident yo‘q</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={240}>
                  <PieChart>
                    <Pie data={stageData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                      {stageData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e2e8f0' }}
                      formatter={(v: any) => [`${v} rezident`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {stageData.map((s: any, i: number) => {
                    const pct = totalResidents > 0 ? Math.round((s.value / totalResidents) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          {s.value} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row — Regions + Resident vs Application growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regions — residents only */}
          <div className="card">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Hududlar bo‘yicha rezidentlar</h3>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Qaysi hududdan eng ko‘p rezident</p>
            {regionData.length === 0 ? (
              <div className="flex items-center justify-center h-60" style={{ color: 'var(--text-muted)' }}>Hali rezident yo‘q</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e2e8f0' }}
                    formatter={(v: any) => [`${v} rezident`, '']} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Rezidentlar">
                    {regionData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Applications vs Residents (last 6 months) */}
          <div className="card">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Murojaatlar va rezidentlar</h3>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>So‘nggi 6 oy: kelgan murojaatlar va qabul qilingan rezidentlar</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={(data?.monthlyApplications || []).map((m: any, idx: number) => ({
                month: m.month,
                applications: m.count,
                residents: data?.monthlyAccepted?.[idx]?.count ?? 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Murojaatlar" />
                <Line type="monotone" dataKey="residents"    stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Rezidentlar" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status distribution (sheet status: High / Medium / Low / On Hold / Dead) */}
        {(data?.leadStatusStats || []).length > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Activity size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sheet bo‘yicha holatlar</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Sheetdan import qilinganlarning holati: High / Medium / Low / On Hold / Dead
                </p>
              </div>
            </div>
            {(() => {
              const COLOR_MAP: Record<string, string> = {
                High: '#10b981', Medium: '#f59e0b', Low: '#3b82f6',
                'On Hold': '#8b5cf6', Dead: '#ef4444',
              };
              const total = data.leadStatusStats.reduce((sum: number, s: any) => sum + s.count, 0);
              return (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {data.leadStatusStats.map((s: any) => {
                    const color = COLOR_MAP[s.status] || '#64748b';
                    const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                    return (
                      <div key={s.status} className="p-4 rounded-xl"
                        style={{ background: `${color}14`, border: `1px solid ${color}33` }}>
                        <p className="text-3xl font-black" style={{ color }}>{s.count}</p>
                        <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{s.status}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Top residents leaderboard */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Award size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Top 5 rezident</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>MRR va foydalanuvchi soni bo‘yicha</p>
            </div>
          </div>
          {(data?.topResidents || []).length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Hali rezident yo‘q</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Startup</th>
                    <th>Soha</th>
                    <th>Hudud</th>
                    <th>Bosqich</th>
                    <th className="text-right">MRR</th>
                    <th className="text-right">Foydalanuvchilar</th>
                    <th className="text-right">Investitsiya</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topResidents || []).map((r: any, i: number) => (
                    <tr key={r._id || i}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})` }}>
                            {r.startup_name?.[0] ?? '?'}
                          </div>
                          <span className="text-sm font-semibold notranslate" translate="no">{r.startup_name}</span>
                        </div>
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.startup_sphere || '—'}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.region || '—'}</td>
                      <td><span className={`badge badge-${r.stage} capitalize`}>{r.stage}</span></td>
                      <td className="text-right font-mono text-sm">{fmtMoney(r.mrr || 0)}</td>
                      <td className="text-right text-sm">{(r.users_count || 0).toLocaleString()}</td>
                      <td className="text-right font-mono text-sm">{fmtMoney(r.investment_raised || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resident vs Application Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Yangi rezidentlar (shu oy)</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#10b981' }}>{data?.newResidentsThisMonth ?? 0}</p>
            <p className="text-xs mt-1" style={{ color: growthChange >= 0 ? '#10b981' : '#ef4444' }}>
              {growthChange >= 0 ? '↑' : '↓'} {Math.abs(growthChange)}% (oldingi oyga nisbatan: {data?.newResidentsLastMonth ?? 0})
            </p>
          </div>
          <div className="card">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Murojaatlar (shu oy)</p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{data?.applicationsThisMonth ?? 0}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>oldingi oy: {data?.applicationsLastMonth ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Konversiya</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#f59e0b' }}>
              {data?.totalApplications > 0
                ? Math.round((data.totalResidents / data.totalApplications) * 100)
                : 0}%
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {data?.totalResidents ?? 0} rezident / {data?.totalApplications ?? 0} murojaat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
