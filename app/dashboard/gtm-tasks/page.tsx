'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { CheckCircle, ChevronDown, ChevronRight, Circle, Lock, Send, Target, Trophy, X } from 'lucide-react';
import { isGtmUnlockedBySprint } from '@/lib/sprint-unlock';

type GtmItem = {
  _id: string;
  section?: 'guide' | 'plan' | 'system';
  title: string;
  content: string;
  category?: string;
};

type ProgressMap = {
  [itemId: string]: { _id?: string; completed: boolean; comment: string; reviewed?: boolean };
};

type PendingTask = {
  gtmItemId: string;
  title: string;
};

const SECTION_LABELS: Record<string, string> = {
  guide: 'Qo‘llanma',
  plan: 'Reja',
  system: 'Tizim',
};

export default function GtmTasksPage() {
  const [startup, setStartup] = useState<any>(null);
  const [items, setItems] = useState<GtmItem[]>([]);
  const [sprintTasks, setSprintTasks] = useState<any[]>([]);
  const [sprintProgress, setSprintProgress] = useState<any[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ guide: true, plan: true, system: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<PendingTask | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [startupRes, itemsRes, sprintTaskRes, sprintProgressRes, gtmProgressRes] = await Promise.all([
          axios.get('/api/startups?limit=1'),
          axios.get('/api/gtm'),
          axios.get('/api/sprint-tasks'),
          axios.get('/api/sprints'),
          axios.get('/api/gtm-progress'),
        ]);

        const map: ProgressMap = {};
        (gtmProgressRes.data.tasks ?? []).forEach((item: any) => {
          map[String(item.gtmItemId)] = {
            _id: item._id,
            completed: item.completed,
            comment: item.comment || '',
            reviewed: item.reviewed || false,
          };
        });

        setStartup(startupRes.data.startups?.[0] ?? null);
        setItems(itemsRes.data.items ?? []);
        setSprintTasks(sprintTaskRes.data.tasks ?? []);
        setSprintProgress(sprintProgressRes.data.tasks ?? []);
        setProgress(map);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const canAccess = startup?.status === 'active' && isGtmUnlockedBySprint(sprintTasks, sprintProgress);

  const grouped = useMemo(() => {
    const map = new Map<string, GtmItem[]>();
    for (const item of items) {
      const section = item.section || 'guide';
      map.set(section, [...(map.get(section) ?? []), item]);
    }
    return Array.from(map.entries()).map(([section, tasks]) => ({ section, tasks }));
  }, [items]);

  const totalTasks = items.length;
  const completedCnt = items.filter((item) => progress[item._id]?.completed).length;
  const pct = totalTasks > 0 ? Math.round((completedCnt / totalTasks) * 100) : 0;

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const openComplete = (task: PendingTask) => {
    if (progress[task.gtmItemId]?.completed) return;
    setCommentModal(task);
    setComment('');
  };

  const completeTask = async () => {
    if (!commentModal) return;
    if (!comment.trim()) {
      toast.error('Vazifa bo‘yicha nima qilganingizni yozing');
      return;
    }

    setSaving(commentModal.gtmItemId);
    try {
      const res = await axios.post('/api/gtm-progress', {
        gtmItemId: commentModal.gtmItemId,
        completed: true,
        comment: comment.trim(),
      });

      setProgress((prev) => ({
        ...prev,
        [commentModal.gtmItemId]: {
          _id: res.data.task?._id,
          completed: true,
          comment: comment.trim(),
          reviewed: false,
        },
      }));
      toast.success('GTM vazifasi bajarildi');
      setCommentModal(null);
    } catch (error: any) {
      const serverError = error.response?.data?.error;
      toast.error(
        serverError === 'comment_required'
          ? 'Vazifa bo‘yicha nima qilganingizni yozing'
          : serverError === 'task_locked'
            ? 'Bu vazifa bajarilgan, uni o‘zgartirib bo‘lmaydi'
            : serverError || 'Xatolik yuz berdi'
      );
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="GTM vazifalari" />
        <div className="p-8 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="animate-fade-in">
        <Header title="GTM vazifalari" subtitle="GTM ochilgandan keyin vazifalar ko‘rinadi" />
        <div className="p-6">
          <div className="card max-w-2xl mx-auto text-center py-14">
            <Lock size={32} className="mx-auto mb-4" style={{ color: '#f59e0b' }} />
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              GTM vazifalari hozircha yopiq
            </p>
            <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
              Sprintning birinchi 3 oyi yakunlangandan keyin GTM vazifalari ochiladi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title="GTM vazifalari" subtitle="GTM bo‘yicha ishlarni yakunlab, natijangizni admin ko‘rishi uchun yuboring" />

      <div className="p-6 space-y-5">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Trophy size={18} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Umumiy natijalar</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {completedCnt} / {totalTasks} ta bajarildi
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{pct}%</div>
          </div>

          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#38bdf8)' }} />
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="card max-w-2xl mx-auto text-center py-14">
            <Target size={32} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Hozircha GTM vazifasi yo‘q
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Admin GTM bo‘limiga vazifa qo‘shganda shu yerda ko‘rinadi.
            </p>
          </div>
        ) : (
          grouped.map((group) => {
            const done = group.tasks.filter((task) => progress[task._id]?.completed).length;
            const sectionPct = group.tasks.length > 0 ? Math.round((done / group.tasks.length) * 100) : 0;

            return (
              <div key={group.section} className="card p-0 overflow-hidden">
                <button
                  onClick={() => toggle(group.section)}
                  className="w-full flex items-center justify-between p-4 text-left"
                  style={{ background: expanded[group.section] ? 'rgba(16,185,129,0.05)' : 'transparent' }}
                >
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {SECTION_LABELS[group.section] || group.section}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {done}/{group.tasks.length} · {sectionPct}%
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="h-full rounded-full" style={{ width: `${sectionPct}%`, background: '#10b981' }} />
                    </div>
                    {expanded[group.section] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                {expanded[group.section] && (
                  <div>
                    {group.tasks.map((task) => {
                      const taskProgress = progress[task._id];
                      const isDone = !!taskProgress?.completed;
                      const isSaving = saving === task._id;

                      return (
                        <div
                          key={task._id}
                          onClick={() => !isDone && !isSaving && openComplete({ gtmItemId: task._id, title: task.title })}
                          className="flex items-start gap-3 px-4 py-4 border-t transition-colors group"
                          style={{
                            borderColor: 'var(--border)',
                            background: isDone ? 'rgba(16,185,129,0.05)' : 'rgba(56,189,248,0.03)',
                            cursor: isDone ? 'default' : 'pointer',
                          }}
                        >
                          <div className="mt-1 flex-shrink-0">
                            {isSaving ? (
                              <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                            ) : isDone ? (
                              <CheckCircle size={20} style={{ color: '#10b981' }} />
                            ) : (
                              <Circle size={20} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-lg font-bold leading-6 ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                {task.title}
                              </p>
                              {task.category && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                                  {task.category}
                                </span>
                              )}
                            </div>

                            <p className="text-sm mt-1.5 leading-6 line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                              {task.content}
                            </p>

                            {isDone && taskProgress?.comment && (
                              <div className="mt-2 text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                                {taskProgress.comment}
                              </div>
                            )}

                            {isDone && (
                              <div className="inline-flex items-center gap-1.5 mt-2 text-xs px-2 py-1 rounded-full" style={{
                                background: taskProgress?.reviewed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                color: taskProgress?.reviewed ? '#10b981' : '#f59e0b',
                              }}>
                                <CheckCircle size={11} />
                                {taskProgress?.reviewed ? 'Admin ko‘rdi' : 'Admin ko‘rib chiqadi'}
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
          })
        )}
      </div>

      {commentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>GTM vazifasini yakunlash</h3>
              <button onClick={() => setCommentModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>

            <p className="text-sm mb-1" style={{ color: '#10b981' }}>{commentModal.title}</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Bu vazifa bo‘yicha nima qilganingizni yozing</p>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="input min-h-28 resize-none mb-5"
              placeholder="Masalan: mijoz segmentlari ajratildi, xabar matnlari tayyorlandi..."
              autoFocus
            />

            <div className="flex gap-3">
              <button onClick={() => setCommentModal(null)} className="btn-secondary flex-1">Bekor qilish</button>
              <button onClick={completeTask} disabled={!comment.trim() || !!saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Yakunlash</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
