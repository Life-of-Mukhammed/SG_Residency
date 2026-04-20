'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/dashboard/Header';
import { GTM_PROMPTS, CAMPAIGN_TEMPLATES, KPI_METRICS, DAILY_SYSTEM } from '@/lib/gtm-data';
import { useAppStore } from '@/store/appStore';
import { Clock, Copy, Check, ChevronDown, ChevronRight, Target, BarChart3, Rocket, Star } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'daily' | 'prompts' | 'campaigns' | 'kpis';

export default function GTMPage() {
  const { lang } = useAppStore();
  const [tab, setTab]             = useState<Tab>('daily');
  const [filter, setFilter]       = useState('');
  const [copied, setCopied]       = useState<string | null>(null);
  const [openCamp, setOpenCamp]   = useState<string | null>('product-launch');
  const [customItems, setCustom]  = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/gtm').then(r => setCustom(r.data.items ?? [])).catch(() => {});
  }, []);

  const L = {
    daily:     { uz: 'Kunlik tizim',   ru: 'Ежедневная система', en: 'Daily System'   },
    prompts:   { uz: 'Kontent banki',  ru: 'Банк контента',      en: 'Content Bank'   },
    campaigns: { uz: 'Kampaniyalar',   ru: 'Кампании',            en: 'Campaigns'      },
    kpis:      { uz: 'KPIlar',         ru: 'KPI',                 en: 'KPIs'           },
    target:    { uz: 'Maqsad',         ru: 'Цель',                en: 'Target'         },
    priority:  { uz: 'Muhimlik',       ru: 'Приоритет',           en: 'Priority'       },
    custom:    { uz: "Qo'shimcha",     ru: 'Доп.',                en: 'Custom'         },
  };
  const t = (k: keyof typeof L) => L[k][lang] ?? L[k].en;

  const cats = ['All', ...Array.from(new Set(GTM_PROMPTS.map(p => p.category)))];
  const filtered = filter && filter !== 'All'
    ? GTM_PROMPTS.filter(p => p.category === filter)
    : GTM_PROMPTS;

  const customPrompts = customItems.filter(i => i.type === 'prompt');
  const allPrompts    = [...filtered, ...customPrompts.map(i => ({ id: i._id, category: i.category, type: i.category, prompt: i.content, isCustom: true, title: i.title }))];

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success(lang === 'uz' ? 'Nusxa olindi!' : lang === 'ru' ? 'Скопировано!' : 'Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'daily',     label: t('daily'),     icon: <Clock size={15}/>   },
    { id: 'prompts',   label: t('prompts'),   icon: <Rocket size={15}/>  },
    { id: 'campaigns', label: t('campaigns'), icon: <Target size={15}/>  },
    { id: 'kpis',      label: t('kpis'),      icon: <BarChart3 size={15}/>},
  ];

  return (
    <div className="animate-fade-in">
      <Header title="GTM" subtitle={lang === 'uz' ? 'Marketing va o\'sish strategiyalari' : lang === 'ru' ? 'Маркетинг и стратегии роста' : 'Marketing & Growth Strategies'} />
      <div className="p-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {tabs.map(t2 => (
            <button key={t2.id} onClick={() => setTab(t2.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t2.id ? 'var(--accent)' : 'transparent',
                color:      tab === t2.id ? 'white'         : 'var(--text-muted)',
              }}>
              {t2.icon} {t2.label}
            </button>
          ))}
        </div>

        {/* Daily System */}
        {tab === 'daily' && (
          <div className="card animate-fade-in">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {lang === 'uz' ? 'Founder Kunlik Tizimi' : lang === 'ru' ? 'Ежедневная система основателя' : "Founder's Daily System"}
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              {lang === 'uz' ? 'Muvaffaqiyatli founderlar uchun kunlik jadval'
                : lang === 'ru' ? 'Ежедневное расписание для успешных фаундеров'
                : 'Optimized daily schedule for startup founders'}
            </p>
            <div className="space-y-2">
              {DAILY_SYSTEM.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <div className="w-14 text-center flex-shrink-0">
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>{item.time}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                    background: item.priority === 'critical' ? '#ef4444'
                              : item.priority === 'high'     ? '#f59e0b'
                              : item.priority === 'medium'   ? '#6366f1' : '#64748b',
                  }} />
                  <p className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{item.task}</p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.duration}</span>
                    <span className={`badge text-xs capitalize ${
                      item.priority === 'critical' ? 'badge-rejected'
                    : item.priority === 'high'     ? 'badge-pending'
                    : item.priority === 'medium'   ? 'badge-mvp' : 'badge-inactive'}`}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Manager custom daily tasks */}
            {customItems.filter(i => i.type === 'daily').length > 0 && (
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <Star size={11}/> {t('custom')}
                </p>
                <div className="space-y-2">
                  {customItems.filter(i => i.type === 'daily').map((item: any) => (
                    <div key={item._id} className="flex items-start gap-3 p-3.5 rounded-xl"
                      style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.content}</p>
                      </div>
                      <button onClick={() => copyText(item.content, item._id)} className="p-1.5 rounded-lg flex-shrink-0"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
                        {copied === item._id ? <Check size={13} style={{ color: '#10b981' }}/> : <Copy size={13}/>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompts */}
        {tab === 'prompts' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{allPrompts.length} prompts</p>
              <div className="flex gap-2 flex-wrap">
                {cats.map(c => (
                  <button key={c} onClick={() => setFilter(c === 'All' ? '' : c)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{
                      background: (filter === c || (!filter && c === 'All')) ? 'var(--accent)' : 'var(--bg-card)',
                      color:      (filter === c || (!filter && c === 'All')) ? 'white'         : 'var(--text-muted)',
                      border:     '1px solid var(--border)',
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPrompts.map((p: any) => (
                <div key={p.id} className="card group cursor-pointer relative"
                  onClick={() => copyText(p.prompt || p.content || '', String(p.id))}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="badge badge-mvp text-xs">{p.category}</span>
                        {(p as any).isCustom && (
                          <span className="badge text-xs flex items-center gap-0.5"
                            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                            <Star size={9}/> {t('custom')}
                          </span>
                        )}
                        {(p as any).type && !((p as any).isCustom) && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(p as any).type}</span>
                        )}
                      </div>
                      {(p as any).title && (
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{(p as any).title}</p>
                      )}
                      <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {p.prompt || p.content}
                      </p>
                    </div>
                    <button className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                      {copied === String(p.id) ? <Check size={14} style={{ color: '#10b981' }}/> : <Copy size={14}/>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaigns */}
        {tab === 'campaigns' && (
          <div className="space-y-4 animate-fade-in">
            {/* Manager custom campaigns */}
            {customItems.filter(i => i.type === 'campaign').map((item: any) => (
              <div key={item._id} className="card" style={{ border: '1.5px solid rgba(99,102,241,0.25)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    <Star size={10}/> {t('custom')}
                  </span>
                  <span className="badge badge-mvp text-xs">{item.category}</span>
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.content}</p>
              </div>
            ))}

            {CAMPAIGN_TEMPLATES.map(c2 => (
              <div key={c2.id} className="card p-0 overflow-hidden">
                <button onClick={() => setOpenCamp(openCamp === c2.id ? null : c2.id)}
                  className="w-full flex items-center justify-between p-5 text-left">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c2.name}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {c2.duration} · {c2.channels.join(', ')}
                    </p>
                  </div>
                  {openCamp === c2.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </button>
                {openCamp === c2.id && (
                  <div className="px-5 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {c2.phases.map(phase => (
                        <div key={phase.week} className="p-4 rounded-xl"
                          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: 'var(--accent)' }}>
                              W{phase.week}
                            </div>
                            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{phase.name}</span>
                          </div>
                          <ul className="space-y-1.5">
                            {phase.tasks.map((task, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span style={{ color: 'var(--accent)' }}>→</span> {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* KPIs */}
        {tab === 'kpis' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {KPI_METRICS.map(kpi => (
                <div key={kpi.id} className="card">
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.name}</p>
                  <p className="text-2xl font-bold mt-2 mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {kpi.unit === '$' && '$'}{kpi.target.toLocaleString()}{kpi.unit === '%' && '%'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('target')}</p>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{kpi.description}</p>
                  </div>
                </div>
              ))}

              {/* Manager custom KPIs */}
              {customItems.filter(i => i.type === 'kpi').map((item: any) => (
                <div key={item._id} className="card" style={{ border: '1.5px solid rgba(99,102,241,0.25)' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Star size={10} style={{ color: 'var(--accent)' }}/>
                    <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{item.category}</p>
                  </div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {lang === 'uz' ? 'KPI kuzatish jadvali' : lang === 'ru' ? 'График отслеживания KPI' : 'KPI Tracking Schedule'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: lang === 'uz' ? 'Kunlik' : lang === 'ru' ? 'Ежедневно' : 'Daily',
                    items: ['Check DAU / active users', 'Monitor revenue transactions', 'Review support tickets'] },
                  { title: lang === 'uz' ? 'Haftalik' : lang === 'ru' ? 'Еженедельно' : 'Weekly',
                    items: ['MRR growth vs. last week', 'New signups & churn', 'Net Promoter Score'] },
                  { title: lang === 'uz' ? 'Oylik' : lang === 'ru' ? 'Ежемесячно' : 'Monthly',
                    items: ['Full P&L review', 'Cohort retention analysis', 'CAC & LTV calculation'] },
                ].map(g => (
                  <div key={g.title} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="font-semibold text-sm mb-3" style={{ color: 'var(--accent)' }}>{g.title}</p>
                    <ul className="space-y-2">
                      {g.items.map((item, i) => (
                        <li key={i} className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--accent)' }}>→</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
