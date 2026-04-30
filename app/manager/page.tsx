'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { Search, ChevronUp, ChevronDown, Trash2, Eye, RefreshCw, Users, TrendingUp, FileText, Calendar, Check, X, Plus, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { UZ_REGIONS } from '@/lib/regions';

type SortKey = 'startup_name' | 'stage' | 'mrr' | 'users_count' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

const REGIONS = UZ_REGIONS;
const STAGES   = ['idea','mvp','growth','scale'];
const STATUSES = ['active','inactive','rejected'];

const EMPTY_RESIDENT = {
  founderName: '',
  email: '',
  phone: '',
  telegram: '',
  startupName: '',
  region: 'Toshkent shahri',
  description: '',
  startupSphere: '',
  stage: 'mvp',
  teamSize: 1,
  mrr: 0,
  usersCount: 0,
  investmentRaised: 0,
  pitchDeck: '',
  resumeUrl: '',
};

export default function ManagerPage() {
  const [startups, setStartups]     = useState<any[]>([]);
  const [analytics, setAnalytics]   = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [stage, setStage]           = useState('');
  const [status, setStatus]         = useState('');
  const [region, setRegion]         = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [sortKey, setSortKey]       = useState<SortKey>('createdAt');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [residentModal, setResidentModal] = useState(false);
  const [residentForm, setResidentForm] = useState(EMPTY_RESIDENT);
  const [savingResident, setSavingResident] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);


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
      if (leadStatus) params.set('leadStatus', leadStatus);
      params.set('page', String(page));
      params.set('limit', '25');
      const [sRes, aRes] = await Promise.all([
        axios.get(`/api/startups?${params}`),
        page === 1 && !search && !stage && !status && !region && !leadStatus
          ? axios.get('/api/analytics')
          : Promise.resolve({ data: null }),
      ]);
      setStartups(sRes.data.startups ?? []);
      setPagination({ total: sRes.data.pagination.total, pages: sRes.data.pagination.pages });
      if (aRes.data) setAnalytics(aRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, stage, status, region, leadStatus, page]);

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

  const saveResident = async () => {
    if (!residentForm.founderName.trim() || !residentForm.email.trim() || !residentForm.phone.trim() || !residentForm.startupName.trim()) {
      toast.error('Asoschi, email, telefon va startup nomi majburiy');
      return;
    }
    setSavingResident(true);
    try {
      await axios.post('/api/residents', residentForm);
      toast.success('Resident qo‘shildi');
      setResidentModal(false);
      setResidentForm(EMPTY_RESIDENT);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Resident qo‘shib bo‘lmadi');
    } finally {
      setSavingResident(false);
    }
  };

  const importResidents = async () => {
    if (!sheetUrl.trim()) {
      toast.error('Google Sheet link kiriting');
      return;
    }
    setImporting(true);
    setImportSummary(null);
    try {
      const res = await axios.put('/api/residents', { sheetUrl: sheetUrl.trim() });
      setImportSummary(res.data);
      toast.success(`${res.data.summary.created} qo‘shildi, ${res.data.summary.updated} yangilandi`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Sheetdan import qilib bo‘lmadi');
    } finally {
      setImporting(false);
    }
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

  const hasFilters = !!(search || stage || status || region || leadStatus);

  return (
    <div className="animate-fade-in">
      <Header title="Rezidentlar paneli" subtitle="Tasdiqlangan va ko'rib chiqilgan startaplar" />
      <div className="p-6 space-y-5">

        {/* Analytics summary — resident-centric */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users size={18}/>,      label: 'Jami rezidentlar',
                value: analytics.totalResidents, color: '#10b981',
                sub: `${analytics.newResidentsThisMonth ?? 0} ta shu oy` },
              { icon: <TrendingUp size={18}/>, label: 'Eng faol oy',
                value: analytics.bestMonth?.month || '—', color: '#f59e0b',
                sub: `${analytics.bestMonth?.count ?? 0} ta rezident` },
              { icon: <FileText size={18}/>,   label: 'Yangi murojaatlar',
                value: analytics.applicationsThisMonth ?? 0, color: '#6366f1',
                sub: `oldingi oy: ${analytics.applicationsLastMonth ?? 0}` },
              { icon: <Calendar size={18}/>,   label: 'Uchrashuvlar',
                value: analytics.totalMeetings ?? 0, color: '#ec4899',
                sub: 'bron qilinganlar' },
            ].map(s => (
              <div key={s.label} className="card flex items-center gap-3 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}22`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{s.value ?? '—'}</p>
                  <p className="text-xs"            style={{ color: 'var(--text-muted)'   }}>{s.label}</p>
                  {s.sub && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>}
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
            <button onClick={() => setResidentModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={13}/> Resident qo‘shish
            </button>
            <button onClick={() => { setImportModal(true); setImportSummary(null); }} className="btn-secondary flex items-center gap-1.5 text-sm">
              <Upload size={13}/> Sheetdan import
            </button>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setStage(''); setStatus(''); setRegion(''); setLeadStatus(''); setPage(1); }}
                className="text-sm px-3 py-2 rounded-xl" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                {t('clear')}
              </button>
            )}
          </div>

          {/* Lead status quick filters */}
          <div className="flex gap-2 flex-wrap">
            {(() => {
              const STATUSES_META: { key: string; label: string; color: string }[] = [
                { key: '',         label: 'Hammasi',  color: '#6366f1' },
                { key: 'High',     label: 'High',     color: '#10b981' },
                { key: 'Medium',   label: 'Medium',   color: '#f59e0b' },
                { key: 'Low',      label: 'Low',      color: '#3b82f6' },
                { key: 'On Hold',  label: 'On Hold',  color: '#8b5cf6' },
                { key: 'Dead',     label: 'Dead',     color: '#ef4444' },
                { key: 'Stopped',  label: 'Stopped',  color: '#64748b' },
              ];
              return STATUSES_META.map((m) => {
                const active = leadStatus === m.key;
                return (
                  <button
                    key={m.key || 'all'}
                    onClick={() => { setLeadStatus(m.key); setPage(1); }}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold transition"
                    style={{
                      background: active ? m.color : `${m.color}1a`,
                      color: active ? 'white' : m.color,
                      border: `1px solid ${m.color}${active ? '' : '40'}`,
                    }}
                  >
                    {m.label}
                  </button>
                );
              });
            })()}
          </div>

          {/* Filter chips */}
          {hasFilters && (
            <div className="flex gap-2 flex-wrap">
              {search     && <span className="badge badge-mvp text-xs">🔍 &quot;{search}&quot;</span>}
              {stage      && <span className="badge badge-mvp text-xs capitalize">📊 {stage}</span>}
              {status     && <span className="badge badge-pending text-xs capitalize">📍 {status}</span>}
              {region     && <span className="badge badge-active text-xs">🌍 {region}</span>}
              {leadStatus && <span className="badge badge-pending text-xs">🏷 {leadStatus}</span>}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-5 text-sm flex-wrap">
          <span style={{ color: 'var(--text-muted)' }}>Jami: <strong style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>{t('active')}: <strong style={{ color: '#10b981' }}>{visibleStartups.filter(s => s.status === 'active').length}</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>Nofaol: <strong style={{ color: '#64748b' }}>{visibleStartups.filter(s => s.status === 'inactive').length}</strong></span>
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
                <th>Status</th>
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
                  <td colSpan={10} className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
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
                const isDead = s.leadStatus === 'Dead' || s.leadStatus === 'Stopped';
                const isOnHold = s.leadStatus === 'On Hold';
                const rowStyle: React.CSSProperties = isResidentRequest ? {
                  background: 'rgba(239,68,68,0.04)',
                  borderLeft: '3px solid rgba(239,68,68,0.55)',
                } : isDead ? {
                  opacity: 0.65,
                  background: 'rgba(239,68,68,0.025)',
                } : isOnHold ? {
                  opacity: 0.85,
                  background: 'rgba(139,92,246,0.025)',
                } : {};
                return (
                <tr key={s._id} style={rowStyle}>
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
                            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium mt-1 inline-block" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
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
                  <td>
                    {(() => {
                      const COLORS: Record<string, string> = {
                        High: '#10b981', Medium: '#f59e0b', Low: '#3b82f6',
                        'On Hold': '#8b5cf6', Dead: '#ef4444', Stopped: '#64748b',
                      };
                      const c = COLORS[s.leadStatus];
                      if (!c) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>;
                      return (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: `${c}1a`, color: c, border: `1px solid ${c}40` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                          {s.leadStatus}
                        </span>
                      );
                    })()}
                  </td>
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
                    {s.acceptedAt
                      ? format(new Date(s.acceptedAt), 'dd.MM.yyyy')
                      : s.createdAt ? format(new Date(s.createdAt), 'dd.MM.yyyy') : '—'}
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

      {residentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
          <div className="card w-full max-w-3xl p-0 overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Resident qo‘shish</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Maʼlumotlar kiritilgach startup avtomatik active resident bo‘ladi</p>
              </div>
              <button onClick={() => setResidentModal(false)} className="btn-secondary p-2"><X size={16}/></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="label">Asoschi F.I.Sh *</label>
                <input className="input" value={residentForm.founderName} onChange={(e) => setResidentForm((p) => ({ ...p, founderName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={residentForm.email} onChange={(e) => setResidentForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Telefon *</label>
                <input className="input" value={residentForm.phone} onChange={(e) => setResidentForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Telegram</label>
                <input className="input" placeholder="@username" value={residentForm.telegram} onChange={(e) => setResidentForm((p) => ({ ...p, telegram: e.target.value }))} />
              </div>
              <div>
                <label className="label">Startup nomi *</label>
                <input className="input" value={residentForm.startupName} onChange={(e) => setResidentForm((p) => ({ ...p, startupName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Hudud</label>
                <select className="input" value={residentForm.region} onChange={(e) => setResidentForm((p) => ({ ...p, region: e.target.value }))}>
                  {REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Soha</label>
                <input className="input" value={residentForm.startupSphere} onChange={(e) => setResidentForm((p) => ({ ...p, startupSphere: e.target.value }))} placeholder="Masalan: Saas, FinTech..." />
              </div>
              <div>
                <label className="label">Bosqich</label>
                <select className="input" value={residentForm.stage} onChange={(e) => setResidentForm((p) => ({ ...p, stage: e.target.value }))}>
                  {STAGES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Jamoa soni</label>
                <input className="input" type="number" min={1} value={residentForm.teamSize} onChange={(e) => setResidentForm((p) => ({ ...p, teamSize: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">MRR</label>
                <input className="input" type="number" min={0} value={residentForm.mrr} onChange={(e) => setResidentForm((p) => ({ ...p, mrr: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Foydalanuvchilar</label>
                <input className="input" type="number" min={0} value={residentForm.usersCount} onChange={(e) => setResidentForm((p) => ({ ...p, usersCount: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Investitsiya</label>
                <input className="input" type="number" min={0} value={residentForm.investmentRaised} onChange={(e) => setResidentForm((p) => ({ ...p, investmentRaised: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Pitch deck link</label>
                <input className="input" value={residentForm.pitchDeck} onChange={(e) => setResidentForm((p) => ({ ...p, pitchDeck: e.target.value }))} />
              </div>
              <div>
                <label className="label">Resume link</label>
                <input className="input" value={residentForm.resumeUrl} onChange={(e) => setResidentForm((p) => ({ ...p, resumeUrl: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Startup haqida</label>
                <textarea className="input min-h-24 resize-none" value={residentForm.description} onChange={(e) => setResidentForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setResidentModal(false)} className="btn-secondary">Bekor qilish</button>
              <button onClick={saveResident} disabled={savingResident} className="btn-primary">
                {savingResident ? 'Saqlanmoqda...' : 'Residentlikka qo‘shish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
          <div className="card w-full max-w-xl p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Google Sheetdan resident import</h3>
                <p className="text-sm mt-1 leading-6" style={{ color: 'var(--text-muted)' }}>
                  Sheet public bo‘lishi kerak. Headerlar: founderName, email, phone, telegram, startupName, region, description, startupSphere, stage, teamSize, mrr, usersCount, investmentRaised.
                </p>
              </div>
              <button onClick={() => setImportModal(false)} className="btn-secondary p-2"><X size={16}/></button>
            </div>
            <label className="label">Google Sheet link</label>
            <input
              className="input mb-4"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            {importSummary && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Jami: {importSummary.summary.total} · Qo‘shildi: {importSummary.summary.created} · Yangilandi: {importSummary.summary.updated} · Xato: {importSummary.summary.failed}
                </p>
                {importSummary.failed?.length > 0 && (
                  <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
                    Birinchi {importSummary.failed.length} xato row qaytdi: {importSummary.failed[0]?.error || 'maʼlumot mos kelmadi'}.
                  </p>
                )}
                {importSummary.summary.headerRow && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Header qatori: {importSummary.summary.headerRow}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setImportModal(false)} className="btn-secondary">Yopish</button>
              <button onClick={importResidents} disabled={importing} className="btn-primary flex items-center gap-2">
                <Upload size={14}/> {importing ? 'Import qilinmoqda...' : 'Auto import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
