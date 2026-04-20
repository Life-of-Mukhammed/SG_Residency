'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { SPRINT_ROADMAP } from '@/lib/sprint-data';
import { useAppStore } from '@/store/appStore';
import { CheckCircle, Circle, Lock, ChevronDown, ChevronRight, Trophy, Target, Star, X, Send } from 'lucide-react';

interface ProgressMap { [taskId: string]: { completed: boolean; comment: string } }
interface CustomTask  { _id: string; quarter: number; month: number; title: string; description: string }
interface PendingTask { taskId: string; quarter: number; month: number; title: string }

export default function SprintPage() {
  const { lang } = useAppStore();
  const [progress, setProgress]   = useState<ProgressMap>({});
  const [custom, setCustom]       = useState<CustomTask[]>([]);
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({ q1: true, q1m1: true });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<PendingTask | null>(null);
  const [comment, setComment]     = useState('');

  const L = {
    title:       { uz: 'Sprint',              ru: 'Спринт',               en: 'Sprint'              },
    subtitle:    { uz: '12 oylik yo\'l xarita',ru: '12-месячная дорожная карта', en: '12-month roadmap' },
    overall:     { uz: 'Umumiy progress',     ru: 'Общий прогресс',       en: 'Overall Progress'    },
    completed:   { uz: 'ta bajarildi',        ru: 'выполнено',            en: 'completed'           },
    commentTitle:{ uz: 'Vazifani yakunlash',  ru: 'Завершить задачу',     en: 'Complete Task'       },
    commentSub:  { uz: 'Nima qildingiz? (majburiy)', ru: 'Что сделали? (обязательно)', en: 'What did you do? (required)' },
    commentPh:   { uz: 'Masalan: landing page yaratdim, 50 foydalanuvchi jalb qildim...', ru: 'Напр: создал лендинг, привлёк 50 пользователей...', en: 'e.g. Built landing page, onboarded 50 users...' },
    locked:      { uz: 'Qulflangan — avval oldingi vazifani bajaring', ru: 'Заблокировано — сначала выполните предыдущее', en: 'Locked — complete previous task first' },
    cancel:      { uz: 'Bekor qilish',        ru: 'Отмена',               en: 'Cancel'              },
    complete:    { uz: 'Yakunlash',           ru: 'Завершить',            en: 'Complete'            },
    custom:      { uz: 'Qo\'shimcha',          ru: 'Доп.',                 en: 'Custom'              },
  };
  const t = (k: keyof typeof L) => L[k][lang] ?? L[k].en;

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          axios.get('/api/sprints'),
          axios.get('/api/sprint-tasks'),
        ]);
        const map: ProgressMap = {};
        (pRes.data.tasks ?? []).forEach((t: any) => {
          map[t.taskId] = { completed: t.completed, comment: t.comment || '' };
        });
        setProgress(map);
        setCustom(cRes.data.tasks ?? []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  // Check if a task is locked (previous in sequence not done)
  const isLocked = (allTaskIds: string[], taskId: string): boolean => {
    const idx = allTaskIds.indexOf(taskId);
    if (idx === 0) return false;
    return !progress[allTaskIds[idx - 1]]?.completed;
  };

  const tryComplete = (task: PendingTask, locked: boolean) => {
    if (locked) { toast.error(t('locked')); return; }
    if (progress[task.taskId]?.completed) {
      // Toggle off — no comment needed
      doSave(task.taskId, task.quarter, task.month, false, '');
      return;
    }
    setCommentModal(task);
    setComment('');
  };

  const doSave = async (taskId: string, quarter: number, month: number, completed: boolean, cmt: string) => {
    setSaving(taskId);
    try {
      const res = await axios.post('/api/sprints', { taskId, quarter, month, completed, comment: cmt });
      if (res.data.error === 'comment_required') {
        toast.error(t('commentSub'));
        return;
      }
      setProgress(p => ({ ...p, [taskId]: { completed, comment: cmt } }));
      if (completed) toast.success('✅ ' + t('completed'));
    } catch (e: any) {
      toast.error(e.response?.data?.error === 'comment_required' ? t('commentSub') : 'Error');
    } finally {
      setSaving(null);
      setCommentModal(null);
    }
  };

  const submitComment = () => {
    if (!comment.trim()) { toast.error(t('commentSub')); return; }
    if (!commentModal) return;
    doSave(commentModal.taskId, commentModal.quarter, commentModal.month, true, comment.trim());
  };

  // All task IDs in order for locking
  const allBuiltInIds = SPRINT_ROADMAP.flatMap(q => q.months.flatMap(m => m.tasks.map(t => t.id)));

  const totalTasks   = allBuiltInIds.length + custom.length;
  const completedCnt = Object.values(progress).filter(p => p.completed).length;
  const pct          = totalTasks > 0 ? Math.round((completedCnt / totalTasks) * 100) : 0;

  const getQProgress = (qi: number) => {
    const q       = SPRINT_ROADMAP[qi];
    const ids     = q.months.flatMap(m => m.tasks.map(t => t.id));
    const custIds = custom.filter(t => t.quarter === qi + 1).map(t => `custom_${t._id}`);
    const all     = [...ids, ...custIds];
    const done    = all.filter(id => progress[id]?.completed).length;
    return { done, total: all.length, pct: all.length > 0 ? Math.round((done / all.length) * 100) : 0 };
  };

  if (loading) return (
    <div>
      <Header title={t('title')} />
      <div className="p-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <Header title={t('title')} subtitle={t('subtitle')} />
      <div className="p-6 space-y-5">

        {/* Overall progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Trophy size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('overall')}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {completedCnt} / {totalTasks} {t('completed')}
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{pct}%</div>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {SPRINT_ROADMAP.map((q, qi) => {
              const { pct: qPct, done, total } = getQProgress(qi);
              return (
                <div key={q.id} className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{qPct}%</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Q{qi+1}: {done}/{total}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarters */}
        {SPRINT_ROADMAP.map((quarter, qi) => {
          const { pct: qPct, done, total } = getQProgress(qi);
          const qOpen = expanded[quarter.id];

          return (
            <div key={quarter.id} className="card p-0 overflow-hidden">
              <button onClick={() => toggle(quarter.id)}
                className="w-full flex items-center justify-between p-4 text-left"
                style={{ background: qOpen ? 'rgba(99,102,241,0.04)' : 'transparent' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    Q{qi+1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{quarter.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{done}/{total} · {qPct}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="h-full rounded-full" style={{ width: `${qPct}%`, background: 'var(--accent)' }} />
                  </div>
                  {qOpen ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                          : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </button>

              {qOpen && (
                <div className="px-4 pb-4 space-y-2.5">
                  {quarter.months.map((month, mi) => {
                    const mKey   = month.id;
                    const mOpen  = expanded[mKey];
                    const cust   = custom.filter(t => t.quarter === qi+1 && t.month === mi+1);
                    const mDone  = month.tasks.filter(t => progress[t.id]?.completed).length
                                 + cust.filter(t => progress[`custom_${t._id}`]?.completed).length;
                    const mTotal = month.tasks.length + cust.length;

                    return (
                      <div key={month.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <button onClick={() => toggle(mKey)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left"
                          style={{ background: 'var(--bg-secondary)' }}>
                          <div className="flex items-center gap-2">
                            <Target size={14} style={{ color: 'var(--accent)' }} />
                            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{month.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                              {mDone}/{mTotal}
                            </span>
                          </div>
                          {mOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                        </button>

                        {mOpen && (
                          <div>
                            {/* Built-in tasks */}
                            {month.tasks.map((task, tidx) => {
                              const done    = !!progress[task.id]?.completed;
                              const locked  = !done && isLocked(allBuiltInIds, task.id);
                              const isSaving = saving === task.id;
                              const cmt     = progress[task.id]?.comment;

                              return (
                                <div key={task.id}
                                  onClick={() => !isSaving && !locked && tryComplete(
                                    { taskId: task.id, quarter: qi+1, month: mi+1, title: task.title }, locked
                                  )}
                                  className="flex items-start gap-3 px-4 py-3.5 border-t transition-colors group"
                                  style={{
                                    borderColor: 'var(--border)',
                                    background: done ? 'rgba(16,185,129,0.04)' : locked ? 'rgba(0,0,0,0.01)' : 'var(--bg-card)',
                                    cursor: locked ? 'not-allowed' : 'pointer',
                                    opacity: locked ? 0.6 : 1,
                                  }}>
                                  <div className="mt-0.5 flex-shrink-0">
                                    {isSaving ? (
                                      <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                                    ) : done ? (
                                      <CheckCircle size={19} style={{ color: '#10b981' }} />
                                    ) : locked ? (
                                      <Lock size={17} style={{ color: 'var(--text-muted)' }} />
                                    ) : (
                                      <Circle size={19} style={{ color: 'var(--text-muted)' }}
                                        className="group-hover:text-indigo-400 transition-colors" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${done ? 'line-through' : ''}`}
                                      style={{ color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                      {task.title}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                      {task.description}
                                    </p>
                                    {done && cmt && (
                                      <div className="flex items-center gap-1.5 mt-1.5 text-xs italic px-2 py-1 rounded-lg"
                                        style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                                        💬 &ldquo;{cmt}&rdquo;
                                      </div>
                                    )}
                                    {locked && (
                                      <p className="text-xs mt-0.5" style={{ color: '#f59e0b' }}>
                                        🔒 {t('locked')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Custom tasks */}
                            {cust.map(task => {
                              const taskId = `custom_${task._id}`;
                              const done   = !!progress[taskId]?.completed;
                              const isSv   = saving === taskId;
                              const cmt    = progress[taskId]?.comment;
                              return (
                                <div key={taskId}
                                  onClick={() => !isSv && tryComplete(
                                    { taskId, quarter: qi+1, month: mi+1, title: task.title }, false
                                  )}
                                  className="flex items-start gap-3 px-4 py-3.5 border-t transition-colors group cursor-pointer"
                                  style={{ borderColor: 'var(--border)', background: done ? 'rgba(16,185,129,0.04)' : 'rgba(99,102,241,0.02)', borderLeft: '2px solid rgba(99,102,241,0.3)' }}>
                                  <div className="mt-0.5 flex-shrink-0">
                                    {isSv ? (
                                      <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                                    ) : done ? (
                                      <CheckCircle size={19} style={{ color: '#10b981' }} />
                                    ) : (
                                      <Circle size={19} style={{ color: 'var(--text-muted)' }} className="group-hover:text-indigo-400 transition-colors" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={`text-sm font-medium ${done ? 'line-through' : ''}`}
                                        style={{ color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                        {task.title}
                                      </p>
                                      <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                                        style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', fontSize: 10 }}>
                                        <Star size={9}/> {t('custom')}
                                      </span>
                                    </div>
                                    {task.description && (
                                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                                    )}
                                    {done && cmt && (
                                      <div className="flex items-center gap-1.5 mt-1.5 text-xs italic px-2 py-1 rounded-lg"
                                        style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                                        💬 &ldquo;{cmt}&rdquo;
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comment modal */}
      {commentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{t('commentTitle')}</h3>
              <button onClick={() => setCommentModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <X size={15}/>
              </button>
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--accent)' }}>{commentModal.title}</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>{t('commentSub')}</p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="input min-h-28 resize-none mb-5"
              placeholder={t('commentPh')}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setCommentModal(null)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button onClick={submitComment} disabled={!comment.trim() || !!saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        : <><Send size={14}/> {t('complete')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
