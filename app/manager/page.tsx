'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { Search, ChevronUp, ChevronDown, Trash2, Eye, RefreshCw, Users, TrendingUp, FileText, Calendar, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '@/store/appStore';
import { UZ_REGIONS } from '@/lib/regions';

type SortKey = 'startup_name' | 'stage' | 'mrr' | 'users_count' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

const REGIONS = UZ_REGIONS;
const STAGES   = ['idea','mvp','growth','scale'];
const STATUSES = ['active','inactive','rejected'];

export default function ManagerPage() {
  const { lang } = useAppStore();
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

  const L = {
    title:    { uz: 'Menejer paneli',   ru: 'Панель менеджера',    en: 'Manager Panel'    },
    subtitle: { uz: 'Barcha startaplar', ru: 'Все стартапы',        en: 'All Startups'     },
    search:   { uz: 'Qidirish...',       ru: 'Поиск...',             en: 'Search...'        },
    allStages:{ uz: "Barcha bosqichlar", ru: 'Все этапы',            en: 'All Stages'       },
    allStatus:{ uz: 'Barcha holat',      ru: 'Все статусы',          en: 'All Status'       },
    allRegions:{uz: 'Barcha hududlar',   ru: 'Все регионы',          en: 'All Regions'      },
    refresh:  { uz: 'Yangilash',         ru: 'Обновить',             en: 'Refresh'          },
    clear:    { uz: 'Tozalash',          ru: 'Сбросить',             en: 'Clear'            },
    total:    { uz: 'Jami',              ru: 'Всего',                en: 'Total'            },
    active:   { uz: 'Aktiv',             ru: 'Активных',             en: 'Active'           },
    pending:  { uz: 'Kutmoqda',          ru: 'Ожидают',              en: 'Pending'          },
    noData:   { uz: "Ma'lumot yo'q",     ru: 'Нет данных',           en: 'No data found'    },
  };
  const t = (k: keyof typeof L) => L[k][lang] ?? L[k].en;

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
      toast.success(`${startup.startup_name} accepted`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept lead');
    } finally {
      setReviewLoading(false);
    }
  };

  const rejectLead = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Reject reason is required');
      return;
    }

    setReviewLoading(true);
    try {
      await updateStatus(rejectTarget._id, 'rejected', rejectReason.trim());
      toast.success(`${rejectTarget.startup_name} rejected`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject lead');
    } finally {
      setReviewLoading(false);
    }
  };

  const deleteStartup = async (id: string) => {
    if (!confirm('Delete this startup?')) return;
    try {
      await axios.delete(`/api/startups/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Failed'); }
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
  const visibleStartups = sorted.filter((startup) => !['pending', 'lead_accepted'].includes(startup.status));

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 inline-flex flex-col" style={{ color: sortKey === k ? 'var(--accent)' : 'var(--text-muted)' }}>
      <ChevronUp   size={8} style={{ opacity: sortKey === k && sortDir === 'asc'  ? 1 : 0.3 }} />
      <ChevronDown size={8} style={{ opacity: sortKey === k && sortDir === 'desc' ? 1 : 0.3 }} />
    </span>
  );

  const hasFilters = !!(search || stage || status || region);

  return (
    <div className="animate-fade-in">
      <Header title="Residents Panel" subtitle="Approved and reviewed residency startups" />
      <div className="p-6 space-y-5">

        {/* Analytics summary */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users size={18}/>,      label: t('total'),   value: analytics.totalStartups,  color: '#6366f1' },
            { icon: <TrendingUp size={18}/>,  label: t('active'),  value: analytics.activeStartups, color: '#10b981' },
            { icon: <FileText size={18}/>,    label: lang === 'uz' ? 'Kutuvchi' : lang === 'ru' ? 'Ожидают' : 'Pending Reports',
                value: analytics.pendingReports, color: '#f59e0b' },
            { icon: <Calendar size={18}/>,    label: lang === 'uz' ? 'Uchrashuvlar' : lang === 'ru' ? 'Встречи' : 'Meetings',
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
          <span style={{ color: 'var(--text-muted)' }}>Residents: <strong style={{ color: 'var(--text-primary)' }}>{visibleStartups.length}</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>{t('active')}: <strong style={{ color: '#10b981' }}>{visibleStartups.filter(s => s.status === 'active').length}</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>Rejected: <strong style={{ color: '#ef4444' }}>{visibleStartups.filter(s => s.status === 'rejected').length}</strong></span>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="cursor-pointer select-none" onClick={() => handleSort('startup_name')}>
                  {lang === 'uz' ? 'Startap' : lang === 'ru' ? 'Стартап' : 'Startup'} <SortIcon k="startup_name"/>
                </th>
                <th>{lang === 'uz' ? 'Asoschisi' : lang === 'ru' ? 'Основатель' : 'Founder'}</th>
                <th>{lang === 'uz' ? 'Hudud' : lang === 'ru' ? 'Регион' : 'Region'}</th>
                <th className="cursor-pointer select-none" onClick={() => handleSort('stage')}>
                  {lang === 'uz' ? 'Bosqich' : lang === 'ru' ? 'Этап' : 'Stage'} <SortIcon k="stage"/>
                </th>
                <th className="cursor-pointer select-none" onClick={() => handleSort('mrr')}>
                  MRR <SortIcon k="mrr"/>
                </th>
                <th className="cursor-pointer select-none" onClick={() => handleSort('users_count')}>
                  {lang === 'uz' ? 'Foydalanuvchilar' : lang === 'ru' ? 'Польз.' : 'Users'} <SortIcon k="users_count"/>
                </th>
                <th>{lang === 'uz' ? 'Holat' : lang === 'ru' ? 'Статус' : 'Status'}</th>
                <th>{lang === 'uz' ? "Qo'shilgan" : lang === 'ru' ? 'Добавлен' : 'Joined'}</th>
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
              ) : visibleStartups.map(s => (
                <tr key={s._id}>
                  <td>
                    <Link href={`/manager/startup/${s._id}`}>
                      <div className="flex items-center gap-2.5 group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          {s.startup_name?.[0] ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold group-hover:underline" style={{ color: 'var(--accent)' }}>
                          <span className="notranslate" translate="no">{s.startup_name}</span>
                        </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.startup_sphere}</p>
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
                    <span className={`badge ${s.status === 'pending' ? 'badge-pending' : `badge-${s.status}`}`}>
                      {s.status === 'pending' ? 'lead' : s.status}
                    </span>
                    {s.status === 'rejected' && s.rejectionReason && (
                      <p className="text-xs mt-2 max-w-52 leading-5" style={{ color: '#ef4444' }}>
                        {s.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.createdAt ? format(new Date(s.createdAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {s.status === 'pending' && (
                        <>
                          <button
                            onClick={() => acceptLead(s)}
                            className="p-1.5 rounded-lg"
                            style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}
                            title="Accept lead"
                          >
                            <Check size={13}/>
                          </button>
                          <button
                            onClick={() => { setRejectTarget(s); setRejectReason(''); }}
                            className="p-1.5 rounded-lg"
                            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                            title="Reject lead"
                          >
                            <X size={13}/>
                          </button>
                        </>
                      )}
                      <Link href={`/manager/startup/${s._id}`}>
                        <button className="p-1.5 rounded-lg" style={{ color: 'var(--accent)', background: 'rgba(99,102,241,0.1)' }} title="View">
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
              ))}
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
              Reject Lead
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Enter the rejection reason for {rejectTarget.startup_name}. The founder will see this message in their dashboard.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input min-h-28 resize-none"
              placeholder="Why is this lead rejected? What should they improve?"
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={rejectLead} disabled={reviewLoading || !rejectReason.trim()} className="btn-danger flex-1">
                {reviewLoading ? 'Saving...' : 'Reject Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
