'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { Search, ChevronUp, ChevronDown, Trash2, Eye, RefreshCw, Users, TrendingUp, FileText, Calendar, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { UZ_REGIONS } from '@/lib/regions';

type SortKey = 'startup_name' | 'stage' | 'mrr' | 'users_count' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

const REGIONS = UZ_REGIONS;
const STAGES   = ['idea','mvp','growth','scale'];
const STATUSES = ['active','inactive','rejected'];

export default function ManagerPage() {
  const [startups, setStartups]     = useState<any[]>([]);
  const [analytics, setAnalytics]   = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [stage, setStage]           = useState('');
  const [status, setStatus]         = useState('');
  const [region, setRegion]         = useState('');
  const [sortKey, setSortKey]       = useState<SortKey>('createdAt');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);


  const T = {
    title:      'Menejer paneli',
    subtitle:   'Barcha startaplar',
    search:     'Qidirish...',
    allStages:  'Barcha bosqichlar',
    allStatus:  'Barcha holat',
    allRegions: 'Barcha hududlar',
    refresh:    'Yangilash',
    clear:      'Tozalash',
    total:      'Jami',
    active:     'Faol',
    pending:    'Kutmoqda',
    noData:     'Ma\'lumot yo\'q',
  };
  const t = (k: keyof typeof T) => T[k];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (stage)  params.set('stage',  stage);
      if (status) params.set('status', status);
      if (region) params.set('region', region);
      params.set('page', String(page));
      params.set('limit', '25');
      const [sRes, aRes] = await Promise.all([
        axios.get(`/api/startups?${params}`),
        page === 1 && !search && !stage && !status && !region
          ? axios.get('/api/analytics')
          : Promise.resolve({ data: null }),
      ]);
      setStartups(sRes.data.startups ?? []);
      setPagination({ total: sRes.data.pagination.total, pages: sRes.data.pagination.pages });
      if (aRes.data) setAnalytics(aRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, stage, status, region, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, s: string, rejectionReason?: string) => {
    await axios.patch(`/api/startups/${id}`, { status: s, rejectionReason });
    fetchData();
  };

  const acceptLead = async (startup: any) => {
    setReviewLoading(true);
    try {
      await updateStatus(startup._id, 'active');
      toast.success(`${startup.startup_name} qabul qilindi`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Leadni qabul qilib bo\'lmadi');
    } finally {
      setReviewLoading(false);
    }
  };

  const rejectLead = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Rad etish sababi talab qilinadi');
      return;
    }

    setReviewLoading(true);
    try {
      await updateStatus(rejectTarget._id, 'rejected', rejectReason.trim());
      toast.success(`${rejectTarget.startup_name} rad etildi`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Leadni rad etib bo\'lmadi');
    } finally {
      setReviewLoading(false);
    }
  };

  const changeStatus = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`/api/startups/${id}`, { status: newStatus });
      toast.success('Holat yangilandi');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Holatni o\'zgartirib bo\'lmadi');
    }
  };

  const deleteStartup = async (id: string) => {
    if (!confirm('Bu startapni o\'chirishni xohlaysizmi?')) return;
    try {
      await axios.delete(`/api/startups/${id}`);
      toast.success('O\'chirildi');
      fetchData();
    } catch { toast.error('Xato yuz berdi'); }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...startups].sort((a, b) => {
    const va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
  const visibleStartups = sorted.filter((startup) =>
    startup.status !== 'lead_accepted' &&
    startup.status !== 'rejected' &&
    !(startup.status === 'pending' && startup.applicationType !== 'existing_resident')
  );

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 inline-flex flex-col" style={{ color: sortKey === k ? 'var(--accent)' : 'var(--text-muted)' }}>
      <ChevronUp   size={8} style={{ opacity: sortKey === k && sortDir === 'asc'  ? 1 : 0.3 }} />
      <ChevronDown size={8} style={{ opacity: sortKey === k && sortDir === 'desc' ? 1 : 0.3 }} />
    </span>
  );

  const hasFilters = !!(search || stage || status || region);

  return (
    <div className="animate-fade-in">
      <Header title="Rezidentlar paneli" subtitle="Tasdiqlangan va ko'rib chiqilgan startaplar" />
      <div className="p-6 space-y-5">

        {/* Analytics summary */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users size={18}/>,      label: t('total'),   value: analytics.totalStartups,  color: '#6366f1' },
            { icon: <TrendingUp size={18}/>,  label: t('active'),  value: analytics.activeStartups, color: '#10b981' },
            { icon: <FileText size={18}/>,    label: 'Kutuvchi hisobotlar',
                value: analytics.pendingReports, color: '#f59e0b' },
            { icon: <Calendar size={18}/>,    label: 'Uchrashuvlar',
                value: analytics.totalMeetings,  color: '#ec4899' },
            ].map(s => (
              <div key={s.label} className="card flex items-center gap-3 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}22`, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value ?? '—'}</p>
                  <p className="text-xs"            style={{ color: 'var(--text-muted)'   }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9 text-sm" placeholder={t('search')} />
            </div>
            <select value={stage}  onChange={e => { setStage(e.target.value); setPage(1); }} className="input text-sm w-auto">
              <option value="">{t('allStages')}</option>
              {STAGES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input text-sm w-auto">
              <option value="">{t('allStatus')}</option>
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <select value={region} onChange={e => { setRegion(e.target.value); setPage(1); }} className="input text-sm w-auto">
              <option value="">{t('allRegions')}</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={fetchData} className="btn-secondary flex items-center gap-1.5 text-sm">
              <RefreshCw size={13}/> {t('refresh')}
            </button>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setStage(''); setStatus(''); setRegion(''); setPage(1); }}
                className="text-sm px-3 py-2 rounded-xl" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                {t('clear')}
              </button>
            )}
          </div>

          {/* Filter chips */}
          {hasFilters && (
            <div className="flex gap-2 flex-wrap">
              {search && <span className="badge badge-mvp text-xs">🔍 &quot;{search}&quot;</span>}
              {stage  && <span className="badge badge-mvp text-xs capitalize">📊 {stage}</span>}
              {status && <span className="badge badge-pending text-xs capitalize">📍 {status}</span>}
              {region && <span className="badge badge-active text-xs">🌍 {region}</span>}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-5 text-sm flex-wrap">
          <span style={{ color: 'var(--text-muted)' }}>Rezidentlar: <strong style={{ color: 'var(--text-primary)' }}>{visibleStartups.length}</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>{t('active')}: <strong style={{ color: '#10b981' }}>{visibleStartups.filter(s => s.status === 'active').length}</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>Rad etilgan: <strong style={{ color: '#ef4444' }}>{visibleStartups.filter(s => s.status === 'rejected').length}</strong></span>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="cursor-pointer select-none" onClick={() => handleSort('startup_name')}>
                  Startap <SortIcon k="startup_name"/>
                </th>
                <th>Asoschisi</th>
                <th>Hudud</th>
                <th className="cursor-pointer select-none" onClick={() => handleSort('stage')}>
                  Bosqich <SortIcon k="stage"/>
                </th>
                <th className="cursor-pointer select-none" onClick={() => handleSort('mrr')}>
                  MRR <SortIcon k="mrr"/>
                </th>
                <th className="cursor-pointer select-none" onClick={() => handleSort('users_count')}>
                  Foydalanuvchilar <SortIcon k="users_count"/>
                </th>
                <th>Holat</th>
                <th>Qo&apos;shilgan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div className="skeleton h-4 rounded" /></td>
                  ))}</tr>
                ))
              ) : visibleStartups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                    {t('noData')}
                    {hasFilters && (
                      <button onClick={() => { setSearch(''); setStage(''); setStatus(''); setRegion(''); }}
                        style={{ color: 'var(--accent)' }} className="ml-2">
                        {t('clear')}
                      </button>
                    )}
                  </td>
                </tr>
              ) : visibleStartups.map(s => {
                const isResidentRequest = s.applicationType === 'existing_resident' && s.status === 'pending';
                return (
                <tr
                  key={s._id}
                  style={isResidentRequest ? {
                    background: 'rgba(239,68,68,0.04)',
                    borderLeft: '3px solid rgba(239,68,68,0.55)',
                  } : {}}
                >
                  <td>
                    <Link href={`/manager/startup/${s._id}`}>
                      <div className="flex items-center gap-2.5 group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: isResidentRequest ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          {s.startup_name?.[0] ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold group-hover:underline" style={{ color: 'var(--accent)' }}>
                            <span className="notranslate" translate="no">{s.startup_name}</span>
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.startup_sphere}</p>
                          {isResidentRequest && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                              Resident so'rovi
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <p className="text-sm notranslate" translate="no">{s.founder_name}</p>
                    <p className="text-xs notranslate" translate="no" style={{ color: 'var(--text-muted)' }}>{s.phone}</p>
                  </td>
                  <td>
                    <span className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--accent)' }}>
                      {s.region}
                    </span>
                  </td>
                  <td><span className={`badge badge-${s.stage} capitalize`}>{s.stage}</span></td>
                  <td className="font-mono text-sm notranslate" translate="no">${s.mrr?.toLocaleString() ?? 0}</td>
                  <td className="text-sm">{s.users_count?.toLocaleString() ?? 0}</td>
                  <td>
                    {isResidentRequest ? (
                      <div className="space-y-1">
                        <span className="text-xs px-2 py-1 rounded-lg font-semibold block w-fit"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                          Yangi so'rov
                        </span>
                        <select
                          value={s.status}
                          onChange={(e) => changeStatus(s._id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg w-full"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                        >
                          <option value="pending">Ko'rib chiqilmoqda</option>
                          <option value="active">Faol</option>
                          <option value="inactive">Nofaol</option>
                        </select>
                      </div>
                    ) : (
                      <select
                        value={s.status}
                        onChange={(e) => changeStatus(s._id, e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-lg"
                        style={{
                          background: s.status === 'active' ? 'rgba(16,185,129,0.12)'
                            : s.status === 'inactive' ? 'rgba(239,68,68,0.08)'
                            : 'var(--bg-secondary)',
                          color: s.status === 'active' ? '#10b981'
                            : s.status === 'inactive' ? '#ef4444'
                            : 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <option value="active">Faol</option>
                        <option value="inactive">Nofaol</option>
                        <option value="pending">Ko'rib chiqilmoqda</option>
                      </select>
                    )}
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.createdAt ? format(new Date(s.createdAt), 'dd.MM.yyyy') : '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {isResidentRequest && (
                        <>
                          <button
                            onClick={() => acceptLead(s)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}
                            title="Kirish berish"
                          >
                            <Check size={12}/> Kirish berish
                          </button>
                          <button
                            onClick={() => { setRejectTarget(s); setRejectReason(''); }}
                            className="p-1.5 rounded-lg"
                            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                            title="Rad etish"
                          >
                            <X size={13}/>
                          </button>
                        </>
                      )}
                      <Link href={`/manager/startup/${s._id}`}>
                        <button className="p-1.5 rounded-lg" style={{ color: 'var(--accent)', background: 'rgba(99,102,241,0.1)' }} title="Ko'rish">
                          <Eye size={13}/>
                        </button>
                      </Link>
                      <button onClick={() => deleteStartup(s._id)}
                        className="p-1.5 rounded-lg" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="btn-secondary px-4 py-2 text-sm" style={{ opacity: page === 1 ? 0.4 : 1 }}>
              ←
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {page} / {pagination.pages} · {pagination.total} total
            </span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages}
              className="btn-secondary px-4 py-2 text-sm" style={{ opacity: page === pagination.pages ? 0.4 : 1 }}>
              →
            </button>
          </div>
        )}
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
          <div className="card w-full max-w-lg p-8">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Leadni rad etish
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              {rejectTarget.startup_name} uchun rad etish sababini kiriting. Asoschi bu xabarni o'z panelidagi ko'radi.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input min-h-28 resize-none"
              placeholder="Nima sababdan rad etilmoqda? Nima yaxshilanishi kerak?"
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="btn-secondary flex-1">
                Bekor qilish
              </button>
              <button onClick={rejectLead} disabled={reviewLoading || !rejectReason.trim()} className="btn-danger flex-1">
                {reviewLoading ? 'Saqlanmoqda...' : 'Rad etish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
