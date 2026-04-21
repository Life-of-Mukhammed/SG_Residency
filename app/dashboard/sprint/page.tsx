'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Lock,
  Send,
  Star,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { useAppStore } from '@/store/appStore';

interface ProgressMap {
  [taskId: string]: { completed: boolean; comment: string };
}

interface CustomTask {
  _id: string;
  quarter: number;
  month: number;
  title: string;
  description?: string;
}

interface PendingTask {
  taskId: string;
  quarter: number;
  month: number;
  title: string;
}

type GroupedQuarter = {
  quarter: number;
  months: Array<{ month: number; tasks: CustomTask[] }>;
};

export default function SprintPage() {
  const { lang } = useAppStore();
  const [startup, setStartup] = useState<any>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [custom, setCustom] = useState<CustomTask[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<PendingTask | null>(null);
  const [comment, setComment] = useState('');

  const L = {
    title: { uz: 'Sprint', ru: 'Спринт', en: 'Sprint' },
    subtitle: {
      uz: 'Admin yoki manager qo‘shgan sprint vazifalari',
      ru: 'Спринт-задачи, добавленные админом или менеджером',
      en: 'Sprint tasks added by admin or manager',
    },
    overall: { uz: 'Umumiy progress', ru: 'Общий прогресс', en: 'Overall Progress' },
    completed: { uz: 'ta bajarildi', ru: 'выполнено', en: 'completed' },
    commentTitle: { uz: 'Vazifani yakunlash', ru: 'Завершить задачу', en: 'Complete Task' },
    commentSub: {
      uz: 'Nima qildingiz? (majburiy)',
      ru: 'Что сделали? (обязательно)',
      en: 'What did you do? (required)',
    },
    commentPh: {
      uz: 'Masalan: landing page tayyor bo‘ldi, intervyular o‘tkazildi...',
      ru: 'Например: лендинг готов, интервью проведены...',
      en: 'Example: landing page done, interviews completed...',
    },
    cancel: { uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' },
    complete: { uz: 'Yakunlash', ru: 'Завершить', en: 'Complete' },
    custom: { uz: 'Custom', ru: 'Custom', en: 'Custom' },
    quarter: { uz: 'Chorak', ru: 'Квартал', en: 'Quarter' },
    month: { uz: 'Oy', ru: 'Месяц', en: 'Month' },
    emptyTitle: {
      uz: 'Hozircha sprint task yo‘q',
      ru: 'Пока нет задач спринта',
      en: 'No sprint tasks yet',
    },
    emptyText: {
      uz: 'Admin yoki manager yangi sprint task qo‘shganda shu yerda chiqadi.',
      ru: 'Когда админ или менеджер добавит задачи, они появятся здесь.',
      en: 'Tasks will appear here when admin or manager adds them.',
    },
    lockedTitle: {
      uz: 'Sprint hozircha yopiq',
      ru: 'Спринт пока закрыт',
      en: 'Sprint is locked',
    },
    lockedText: {
      uz: 'Residency arizangiz tasdiqlangandan keyin sprint ochiladi.',
      ru: 'Спринт откроется после одобрения вашей residency заявки.',
      en: 'Sprint opens after your residency application is approved.',
    },
  };

  const t = (k: keyof typeof L) => L[k][lang] ?? L[k].en;

  useEffect(() => {
    const load = async () => {
      try {
        const [progressRes, startupRes, customRes] = await Promise.all([
          axios.get('/api/sprints'),
          axios.get('/api/startups?limit=1'),
          axios.get('/api/sprint-tasks'),
        ]);

        const map: ProgressMap = {};
        (progressRes.data.tasks ?? []).forEach((item: any) => {
          map[item.taskId] = { completed: item.completed, comment: item.comment || '' };
        });

        setProgress(map);
        setStartup(startupRes.data.startups?.[0] ?? null);
        setCustom(customRes.data.tasks ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const grouped = useMemo<GroupedQuarter[]>(() => {
    const quarterMap = new Map<number, Map<number, CustomTask[]>>();

    for (const task of custom) {
      const quarter = quarterMap.get(task.quarter) ?? new Map<number, CustomTask[]>();
      const monthTasks = quarter.get(task.month) ?? [];
      monthTasks.push(task);
      quarter.set(task.month, monthTasks);
      quarterMap.set(task.quarter, quarter);
    }

    return Array.from(quarterMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([quarter, months]) => ({
        quarter,
        months: Array.from(months.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([month, tasks]) => ({ month, tasks })),
      }));
  }, [custom]);

  useEffect(() => {
    if (grouped.length === 0) return;

    setExpanded((prev) => {
      const next = { ...prev };

      for (const group of grouped) {
        const qKey = `q${group.quarter}`;
        if (!(qKey in next)) next[qKey] = group.quarter === grouped[0].quarter;

        for (const month of group.months) {
          const mKey = `q${group.quarter}m${month.month}`;
          if (!(mKey in next)) {
            next[mKey] = group.quarter === grouped[0].quarter && month.month === group.months[0].month;
          }
        }
      }

      return next;
    });
  }, [grouped]);

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalTasks = custom.length;
  const completedCnt = custom.filter((task) => progress[`custom_${task._id}`]?.completed).length;
  const pct = totalTasks > 0 ? Math.round((completedCnt / totalTasks) * 100) : 0;

  const doSave = async (taskId: string, quarter: number, month: number, completed: boolean, cmt: string) => {
    setSaving(taskId);
    try {
      const res = await axios.post('/api/sprints', { taskId, quarter, month, completed, comment: cmt });
      if (res.data.error === 'comment_required') {
        toast.error(t('commentSub'));
        return;
      }

      setProgress((prev) => ({ ...prev, [taskId]: { completed, comment: cmt } }));
      if (completed) toast.success('OK');
    } catch (error: any) {
      toast.error(error.response?.data?.error === 'comment_required' ? t('commentSub') : 'Error');
    } finally {
      setSaving(null);
      setCommentModal(null);
    }
  };

  const tryComplete = (task: PendingTask) => {
    if (progress[task.taskId]?.completed) {
      doSave(task.taskId, task.quarter, task.month, false, '');
      return;
    }

    setCommentModal(task);
    setComment('');
  };

  const submitComment = () => {
    if (!comment.trim()) {
      toast.error(t('commentSub'));
      return;
    }
    if (!commentModal) return;

    doSave(commentModal.taskId, commentModal.quarter, commentModal.month, true, comment.trim());
  };

  if (loading) {
    return (
      <div>
        <Header title={t('title')} />
        <div className="p-8 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title={t('title')} subtitle={t('subtitle')} />

      {startup && startup.status !== 'active' ? (
        <div className="p-6">
          <div className="card max-w-2xl mx-auto text-center py-14">
            <Lock size={32} className="mx-auto mb-4" style={{ color: '#f59e0b' }} />
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('lockedTitle')}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('lockedText')}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)' }}
                >
                  <Trophy size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {t('overall')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {completedCnt} / {totalTasks} {t('completed')}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                {pct}%
              </div>
            </div>

            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
              />
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="card max-w-2xl mx-auto text-center py-14">
              <Target size={32} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
              <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('emptyTitle')}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('emptyText')}
              </p>
            </div>
          ) : (
            grouped.map((group) => {
              const qKey = `q${group.quarter}`;
              const qTasks = group.months.flatMap((month) => month.tasks);
              const qDone = qTasks.filter((task) => progress[`custom_${task._id}`]?.completed).length;
              const qPct = qTasks.length > 0 ? Math.round((qDone / qTasks.length) * 100) : 0;

              return (
                <div key={qKey} className="card p-0 overflow-hidden">
                  <button
                    onClick={() => toggle(qKey)}
                    className="w-full flex items-center justify-between p-4 text-left"
                    style={{ background: expanded[qKey] ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                      >
                        Q{group.quarter}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {t('quarter')} {group.quarter}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {qDone}/{qTasks.length} · {qPct}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="h-full rounded-full" style={{ width: `${qPct}%`, background: 'var(--accent)' }} />
                      </div>
                      {expanded[qKey] ? (
                        <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                  </button>

                  {expanded[qKey] && (
                    <div className="px-4 pb-4 space-y-2.5">
                      {group.months.map((monthGroup) => {
                        const mKey = `q${group.quarter}m${monthGroup.month}`;
                        const mDone = monthGroup.tasks.filter((task) => progress[`custom_${task._id}`]?.completed).length;

                        return (
                          <div
                            key={mKey}
                            className="rounded-xl overflow-hidden"
                            style={{ border: '1px solid var(--border)' }}
                          >
                            <button
                              onClick={() => toggle(mKey)}
                              className="w-full flex items-center justify-between px-4 py-3 text-left"
                              style={{ background: 'var(--bg-secondary)' }}
                            >
                              <div className="flex items-center gap-2">
                                <Target size={14} style={{ color: 'var(--accent)' }} />
                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                  {t('month')} {monthGroup.month}
                                </span>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
                                >
                                  {mDone}/{monthGroup.tasks.length}
                                </span>
                              </div>
                              {expanded[mKey] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>

                            {expanded[mKey] && (
                              <div>
                                {monthGroup.tasks.map((task) => {
                                  const taskId = `custom_${task._id}`;
                                  const done = !!progress[taskId]?.completed;
                                  const isSaving = saving === taskId;
                                  const cmt = progress[taskId]?.comment;

                                  return (
                                    <div
                                      key={taskId}
                                      onClick={() =>
                                        !isSaving &&
                                        tryComplete({
                                          taskId,
                                          quarter: group.quarter,
                                          month: monthGroup.month,
                                          title: task.title,
                                        })
                                      }
                                      className="flex items-start gap-3 px-4 py-3.5 border-t transition-colors group cursor-pointer"
                                      style={{
                                        borderColor: 'var(--border)',
                                        background: done ? 'rgba(16,185,129,0.04)' : 'rgba(99,102,241,0.02)',
                                        borderLeft: '2px solid rgba(99,102,241,0.3)',
                                      }}
                                    >
                                      <div className="mt-0.5 flex-shrink-0">
                                        {isSaving ? (
                                          <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                                        ) : done ? (
                                          <CheckCircle size={19} style={{ color: '#10b981' }} />
                                        ) : (
                                          <Circle
                                            size={19}
                                            style={{ color: 'var(--text-muted)' }}
                                            className="group-hover:text-indigo-400 transition-colors"
                                          />
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p
                                            className={`text-sm font-medium ${done ? 'line-through' : ''}`}
                                            style={{
                                              color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                                            }}
                                          >
                                            {task.title}
                                          </p>
                                          <span
                                            className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                                            style={{
                                              background: 'rgba(99,102,241,0.12)',
                                              color: 'var(--accent)',
                                              fontSize: 10,
                                            }}
                                          >
                                            <Star size={9} /> {t('custom')}
                                          </span>
                                        </div>

                                        {task.description && (
                                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            {task.description}
                                          </p>
                                        )}

                                        {done && cmt && (
                                          <div
                                            className="flex items-center gap-1.5 mt-1.5 text-xs italic px-2 py-1 rounded-lg"
                                            style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}
                                          >
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
            })
          )}
        </div>
      )}

      {commentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        >
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {t('commentTitle')}
              </h3>
              <button
                onClick={() => setCommentModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-sm mb-1" style={{ color: 'var(--accent)' }}>
              {commentModal.title}
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              {t('commentSub')}
            </p>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="input min-h-28 resize-none mb-5"
              placeholder={t('commentPh')}
              autoFocus
            />

            <div className="flex gap-3">
              <button onClick={() => setCommentModal(null)} className="btn-secondary flex-1">
                {t('cancel')}
              </button>
              <button
                onClick={submitComment}
                disabled={!comment.trim() || !!saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} /> {t('complete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
