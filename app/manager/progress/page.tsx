'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { CheckCircle, Clock, TrendingUp, MessageSquare, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '@/store/appStore';

interface ProgressData {
  startup:      { _id: string; startup_name: string; stage: string; region: string };
  founder:      { name: string; surname: string; email: string };
  totalTasks:   number;
  completed:    number;
  pct:          number;
  lastActivity: { taskId: string; comment: string; completedAt: string } | null;
    recentTasks:  any[];
}

export default function ProgressPage() {
  const { lang } = useAppStore();
  const [data, setData]         = useState<ProgressData[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const labels = {
    title:       { uz: "Founder Progress",     ru: "Прогресс стартапов",    en: "Founder Progress"    },
    subtitle:    { uz: "Jami sprint tasklarga nisbatan founder progress", ru: "Прогресс фаундеров относительно всех sprint задач", en: "Founder progress against all sprint tasks" },
    noData:      { uz: "Aktiv startaplar yo'q", ru: "Нет активных стартапов", en: "No active startups" },
    completed:   { uz: "Bajarildi",             ru: "Выполнено",              en: "Completed"          },
    progress:    { uz: "Jarayon",               ru: "Прогресс",               en: "Progress"           },
    lastTask:    { uz: "Oxirgi vazifa",          ru: "Последняя задача",       en: "Last task"          },
    comment:     { uz: "Kommentariya",           ru: "Комментарий",            en: "Comment"            },
    recentTasks: { uz: "So'nggi vazifalar",      ru: "Недавние задачи",        en: "Recent tasks"       },
    review:      { uz: "Ko'rildi deb belgilash", ru: "Отметить просмотренным", en: "Mark as reviewed"  },
    reviewed:    { uz: "Ko'rildi",               ru: "Проверено",              en: "Reviewed"           },
    reviewSaved: { uz: "Tasdiqlandi",            ru: "Подтверждено",           en: "Confirmed"          },
  };
  const l = (k: keyof typeof labels) => labels[k][lang] ?? labels[k].en;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/progress');
      setData(res.data.progress ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markReviewed = async (taskProgressId: string) => {
    try {
      await axios.patch('/api/progress', { taskProgressId, reviewed: true });
      toast.success(l('reviewSaved'));
      await load();
    } catch (error) {
      console.error(error);
      toast.error('Failed');
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-fade-in">
      <Header title={l('title')} subtitle={l('subtitle')} />
      <div className="p-8 space-y-6">

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: lang === 'uz' ? 'Jami founderlar' : lang === 'ru' ? 'Всего фаундеров' : 'Total Founders',
              value: data.length, color: '#6366f1' },
            { label: lang === 'uz' ? 'Aktiv' : lang === 'ru' ? 'Активных' : 'Active',
              value: data.filter(d => d.pct > 0).length, color: '#10b981' },
            { label: lang === 'uz' ? "O'rtacha progress" : lang === 'ru' ? 'Средний прогресс' : 'Avg Progress',
              value: data.length > 0 ? `${Math.round(data.reduce((s, d) => s + d.pct, 0) / data.length)}%` : '0%',
              color: '#f59e0b' },
            { label: lang === 'uz' ? 'Jami bajarildi' : lang === 'ru' ? 'Всего выполнено' : 'Total Completed',
              value: data.reduce((s, d) => s + d.completed, 0), color: '#ec4899' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1"        style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Refresh */}
        <div className="flex justify-end">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={13}/> {lang === 'uz' ? 'Yangilash' : lang === 'ru' ? 'Обновить' : 'Refresh'}
          </button>
        </div>

        {/* Founder cards */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="card text-center py-16">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-20" />
            <p style={{ color: 'var(--text-muted)' }}>{l('noData')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.sort((a, b) => b.pct - a.pct).map(d => {
              const isOpen = expanded.has(d.startup._id);
              return (
                <div key={d.startup._id} className="card p-0 overflow-hidden">
                  {/* Main row */}
                  <button
                    onClick={() => toggleExpand(d.startup._id)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                      {d.startup.startup_name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {d.startup.startup_name}
                        </p>
                        <span className={`badge badge-${d.startup.stage} text-xs`}>{d.startup.stage}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>
                          {d.startup.region}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {d.founder?.name} {d.founder?.surname}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {d.completed}/{d.totalTasks}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{l('completed')}</p>
                      </div>

                      {/* Progress circle */}
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="18" fill="none" stroke="var(--bg-secondary)" strokeWidth="4" />
                          <circle cx="24" cy="24" r="18" fill="none"
                            stroke={d.pct >= 75 ? '#10b981' : d.pct >= 40 ? '#f59e0b' : '#6366f1'}
                            strokeWidth="4"
                            strokeDasharray={`${2 * Math.PI * 18}`}
                            strokeDashoffset={`${2 * Math.PI * 18 * (1 - d.pct / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{d.pct}%</span>
                        </div>
                      </div>

                      {isOpen ? <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
                              : <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </button>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="h-full transition-all duration-700"
                      style={{
                        width: `${d.pct}%`,
                        background: d.pct >= 75 ? '#10b981' : d.pct >= 40 ? '#f59e0b' : '#6366f1',
                      }} />
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="p-5 border-t space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>

                      {/* Last activity */}
                      {d.lastActivity && (
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={15} style={{ color: '#10b981' }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {l('lastTask')}
                            </p>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {d.lastActivity.completedAt ? format(new Date(d.lastActivity.completedAt), 'MMM d, HH:mm') : ''}
                            </span>
                          </div>
                          <p className="text-xs font-mono mb-2" style={{ color: 'var(--accent)' }}>
                            {d.lastActivity.taskId}
                          </p>
                          {d.lastActivity.comment && (
                            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                              <MessageSquare size={13} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} />
                              <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
                                &ldquo;{d.lastActivity.comment}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Total Sprint Tasks</p>
                          <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{d.totalTasks}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Completed</p>
                          <p className="text-2xl font-bold mt-2" style={{ color: '#10b981' }}>{d.completed}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Completion</p>
                          <p className="text-2xl font-bold mt-2" style={{ color: 'var(--accent)' }}>{d.pct}%</p>
                        </div>
                      </div>

                      {/* Recent tasks list */}
                      {d.recentTasks.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                            {l('recentTasks')}
                          </p>
                          <div className="space-y-1.5">
                            {d.recentTasks.filter((t: any) => t.completed).map((t: any) => (
                              <div key={t._id} className="flex items-start gap-3 p-2.5 rounded-lg"
                                style={{ background: 'var(--bg-card)' }}>
                                <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                      {t.taskId}
                                    </p>
                                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                      Q{t.quarter} M{t.month}
                                    </span>
                                    <span
                                      className="text-[10px] px-2 py-0.5 rounded-full"
                                      style={{
                                        background: t.reviewed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                        color: t.reviewed ? '#10b981' : '#f59e0b',
                                      }}
                                    >
                                      {t.reviewed ? l('reviewed') : l('review')}
                                    </span>
                                  </div>
                                  {t.comment && (
                                    <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>
                                      &ldquo;{t.comment}&rdquo;
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {t.completedAt ? format(new Date(t.completedAt), 'MMM d') : ''}
                                  </span>
                                  {!t.reviewed && (
                                    <button
                                      onClick={() => markReviewed(t._id)}
                                      className="text-[11px] px-2.5 py-1 rounded-lg"
                                      style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
                                    >
                                      {l('review')}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
