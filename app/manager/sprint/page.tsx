'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Plus, Trash2, Edit2, X, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

interface CustomTask {
  _id: string;
  quarter: number;
  month: number;
  title: string;
  description: string;
  createdBy?: { name: string; surname: string };
}

const QUARTERS = [
  { q: 1, label: 'Q1 — Foundation', months: ['Month 1 — Discovery', 'Month 2 — Validation', 'Month 3 — Build'] },
  { q: 2, label: 'Q2 — Growth', months: ['Month 4 — Traction', 'Month 5 — Revenue', 'Month 6 — Scale Prep'] },
  { q: 3, label: 'Q3 — Scale', months: ['Month 7 — Investment', 'Month 8 — Team', 'Month 9 — Operations'] },
  { q: 4, label: 'Q4 — Dominate', months: ['Month 10 — Leadership', 'Month 11 — Consolidation', 'Month 12 — Next Level'] },
];

const EMPTY = { quarter: 1, month: 1, title: '', description: '' };

export default function ManagerSprintPage() {
  const { lang } = useAppStore();
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ q1: true });
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTask, setEditTask] = useState<CustomTask | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const T = {
    title: { uz: 'Sprint Menejeri', ru: 'Sprint Менеджер', en: 'Sprint Manager' },
    subtitle: { uz: 'Founderlar uchun sprint vazifalarini boshqaring', ru: 'Управляйте sprint задачами для фаундеров', en: 'Manage sprint tasks for founders' },
    customTasks: { uz: "Qo'shimcha vazifalar", ru: 'Дополнительные задачи', en: 'Custom tasks added' },
    tip: { uz: "Bu yerda qo'shilgan vazifalar founder sprint sahifasida static roadmap bilan birga ko'rinadi.", ru: 'Добавленные здесь задачи показываются у фаундеров вместе со статической дорожной картой.', en: 'Tasks added here appear on the founder sprint page alongside the static roadmap.' },
    addTask: { uz: "Vazifa qo'shish", ru: 'Добавить задачу', en: 'Add Task' },
    editTask: { uz: 'Vazifani tahrirlash', ru: 'Редактировать задачу', en: 'Edit Task' },
    quarter: { uz: 'Kvartal', ru: 'Квартал', en: 'Quarter' },
    month: { uz: 'Oy', ru: 'Месяц', en: 'Month' },
    taskTitle: { uz: 'Vazifa nomi', ru: 'Название задачи', en: 'Task Title' },
    description: { uz: 'Tavsif', ru: 'Описание', en: 'Description' },
    taskTitleReq: { uz: 'Vazifa nomi kerak', ru: 'Название задачи обязательно', en: 'Title is required' },
    updated: { uz: 'Yangilandi', ru: 'Обновлено', en: 'Updated!' },
    added: { uz: "Qo'shildi", ru: 'Добавлено', en: 'Added!' },
    deleted: { uz: "O'chirildi", ru: 'Удалено', en: 'Deleted' },
    failed: { uz: 'Xatolik yuz berdi', ru: 'Произошла ошибка', en: 'Failed' },
    noTasks: { uz: "Hozircha vazifa yo'q", ru: 'Пока задач нет', en: 'No custom tasks yet' },
    by: { uz: 'muallif', ru: 'автор', en: 'by' },
    cancel: { uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' },
    saveChanges: { uz: "O'zgarishlarni saqlash", ru: 'Сохранить изменения', en: 'Save Changes' },
  };
  const t = (key: keyof typeof T) => T[key][lang] ?? T[key].en;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/sprint-tasks');
      setTasks(res.data.tasks ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const openAdd = (quarter?: number, month?: number) => {
    setForm({ ...EMPTY, quarter: quarter ?? 1, month: month ?? 1 });
    setEditTask(null);
    setModal('add');
  };

  const openEdit = (task: CustomTask) => {
    setForm({ quarter: task.quarter, month: task.month, title: task.title, description: task.description });
    setEditTask(task);
    setModal('edit');
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error(t('taskTitleReq'));
      return;
    }
    setSaving(true);
    try {
      if (modal === 'edit' && editTask) {
        await axios.patch(`/api/sprint-tasks/${editTask._id}`, form);
        toast.success(t('updated'));
      } else {
        await axios.post('/api/sprint-tasks', form);
        toast.success(t('added'));
      }
      setModal(null);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await axios.delete(`/api/sprint-tasks/${id}`);
      toast.success(t('deleted'));
      await load();
    } catch {
      toast.error(t('failed'));
    }
  };

  const getTasksForMonth = (quarter: number, month: number) => tasks.filter((task) => task.quarter === quarter && task.month === month);

  return (
    <div className="animate-fade-in">
      <Header title={t('title')} subtitle={t('subtitle')} />
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="card py-3 px-5 flex items-center gap-3">
            <Target size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tasks.length}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('customTasks')}</p>
            </div>
          </div>
          <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> {t('addTask')}
          </button>
        </div>

        <div className="card p-4 text-sm" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>{t('tip')}</p>
        </div>

        {QUARTERS.map(({ q, label, months }) => {
          const qKey = `q${q}`;
          const qOpen = expanded[qKey];
          const qTotal = tasks.filter((task) => task.quarter === q).length;

          return (
            <div key={q} className="card p-0 overflow-hidden">
              <button
                onClick={() => toggle(qKey)}
                className="w-full flex items-center justify-between p-5 text-left"
                style={{ background: qOpen ? 'rgba(99,102,241,0.04)' : 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    Q{q}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{qTotal} {t('customTasks').toLowerCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); openAdd(q, 1); }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}
                  >
                    <Plus size={12} /> {t('addTask')}
                  </button>
                  {qOpen ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </button>

              {qOpen && (
                <div className="border-t px-5 pb-5 pt-4 space-y-4" style={{ borderColor: 'var(--border)' }}>
                  {months.map((monthLabel, index) => {
                    const month = index + 1;
                    const mKey = `q${q}m${month}`;
                    const mOpen = expanded[mKey] !== false;
                    const monthTasks = getTasksForMonth(q, month);

                    return (
                      <div key={mKey} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <button
                          onClick={() => toggle(mKey)}
                          className="w-full flex items-center justify-between px-4 py-3"
                          style={{ background: 'var(--bg-secondary)' }}
                        >
                          <div className="flex items-center gap-2">
                            <Target size={14} style={{ color: 'var(--accent)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{monthLabel}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                              {monthTasks.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openAdd(q, month); }}
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}
                            >
                              <Plus size={11} />
                            </button>
                            {mOpen ? <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />}
                          </div>
                        </button>

                        {mOpen && (
                          <div>
                            {loading ? (
                              <div className="px-4 py-4"><div className="skeleton h-12 rounded-xl" /></div>
                            ) : monthTasks.length === 0 ? (
                              <div className="px-4 py-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                {t('noTasks')}
                              </div>
                            ) : (
                              monthTasks.map((task) => (
                                <div key={task._id} className="flex items-start gap-3 px-4 py-3 border-t group" style={{ borderColor: 'var(--border)' }}>
                                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--accent)' }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                                    {task.description && (
                                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                                    )}
                                    {task.createdBy && (
                                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                                        {t('by')} {task.createdBy.name} {task.createdBy.surname}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg" style={{ color: 'var(--accent)', background: 'rgba(99,102,241,0.1)' }}>
                                      <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => remove(task._id)} className="p-1.5 rounded-lg" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {modal === 'edit' ? t('editTask') : t('addTask')}
              </h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('quarter')} *</label>
                  <select value={form.quarter} onChange={(e) => setForm((prev) => ({ ...prev, quarter: Number(e.target.value) }))} className="input text-sm">
                    {[1, 2, 3, 4].map((quarter) => <option key={quarter} value={quarter}>Q{quarter}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('month')} *</label>
                  <select value={form.month} onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))} className="input text-sm">
                    {[1, 2, 3].map((month) => <option key={month} value={month}>{t('month')} {month}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">{t('taskTitle')} *</label>
                <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="input text-sm" />
              </div>

              <div>
                <label className="label">{t('description')}</label>
                <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="input min-h-20 resize-none text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : modal === 'edit' ? t('saveChanges') : t('addTask')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
