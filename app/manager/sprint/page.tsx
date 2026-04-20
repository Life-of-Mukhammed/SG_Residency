'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Plus, Trash2, Edit2, X, Target, ChevronDown, ChevronRight } from 'lucide-react';

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
  { q: 2, label: 'Q2 — Growth',     months: ['Month 4 — Traction',  'Month 5 — Revenue',    'Month 6 — Scale Prep'] },
  { q: 3, label: 'Q3 — Scale',      months: ['Month 7 — Investment','Month 8 — Team',        'Month 9 — Operations'] },
  { q: 4, label: 'Q4 — Dominate',   months: ['Month 10 — Leadership','Month 11 — Consolidation','Month 12 — Next Level'] },
];

const EMPTY = { quarter: 1, month: 1, title: '', description: '' };

export default function ManagerSprintPage() {
  const [tasks, setTasks]       = useState<CustomTask[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'q1': true });
  const [modal, setModal]       = useState<'add' | 'edit' | null>(null);
  const [editTask, setEditTask] = useState<CustomTask | null>(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/sprint-tasks');
      setTasks(res.data.tasks ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

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
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (modal === 'edit' && editTask) {
        await axios.patch(`/api/sprint-tasks/${editTask._id}`, form);
        toast.success('Task updated!');
      } else {
        await axios.post('/api/sprint-tasks', form);
        toast.success('Task added!');
      }
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await axios.delete(`/api/sprint-tasks/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const getTasksForMonth = (q: number, m: number) =>
    tasks.filter(t => t.quarter === q && t.month === m);

  const totalCustom = tasks.length;

  return (
    <div className="animate-fade-in">
      <Header title="Sprint Manager" subtitle="Add and manage custom sprint tasks for founders" />
      <div className="p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="card py-3 px-5 flex items-center gap-3">
            <Target size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{totalCustom}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Custom tasks added</p>
            </div>
          </div>
          <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Task
          </button>
        </div>

        <div className="card p-4 text-sm" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            💡 Custom tasks you add here will appear in founders&apos; Sprint page alongside the default roadmap tasks.
            Founders can check them off just like built-in tasks.
          </p>
        </div>

        {/* Quarters */}
        {QUARTERS.map(({ q, label, months }) => {
          const qKey = `q${q}`;
          const qOpen = expanded[qKey];
          const qTotal = tasks.filter(t => t.quarter === q).length;

          return (
            <div key={q} className="card p-0 overflow-hidden">
              <button
                onClick={() => toggle(qKey)}
                className="w-full flex items-center justify-between p-5 text-left"
                style={{ background: qOpen ? 'rgba(99,102,241,0.04)' : 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    Q{q}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {qTotal} custom task{qTotal !== 1 ? 's' : ''} added
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={e => { e.stopPropagation(); openAdd(q, 1); }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}
                  >
                    <Plus size={12} /> Add
                  </button>
                  {qOpen ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </button>

              {qOpen && (
                <div className="border-t px-5 pb-5 pt-4 space-y-4" style={{ borderColor: 'var(--border)' }}>
                  {months.map((monthLabel, mi) => {
                    const m = mi + 1;
                    const mKey = `q${q}m${m}`;
                    const mOpen = expanded[mKey] !== false; // default open
                    const monthTasks = getTasksForMonth(q, m);

                    return (
                      <div key={m} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <button
                          onClick={() => toggle(mKey)}
                          className="w-full flex items-center justify-between px-4 py-3"
                          style={{ background: 'var(--bg-secondary)' }}
                        >
                          <div className="flex items-center gap-2">
                            <Target size={14} style={{ color: 'var(--accent)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{monthLabel}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                              {monthTasks.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); openAdd(q, m); }}
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
                            {monthTasks.length === 0 ? (
                              <div className="px-4 py-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                No custom tasks — <button onClick={() => openAdd(q, m)} style={{ color: 'var(--accent)' }}>add one</button>
                              </div>
                            ) : (
                              monthTasks.map(task => (
                                <div
                                  key={task._id}
                                  className="flex items-start gap-3 px-4 py-3 border-t group"
                                  style={{ borderColor: 'var(--border)' }}
                                >
                                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--accent)' }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                                    {task.description && (
                                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                                    )}
                                    {task.createdBy && (
                                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                        by {task.createdBy.name} {task.createdBy.surname}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(task)}
                                      className="p-1.5 rounded-lg" style={{ color: 'var(--accent)', background: 'rgba(99,102,241,0.1)' }}>
                                      <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => remove(task._id)}
                                      className="p-1.5 rounded-lg" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {modal === 'edit' ? 'Edit Task' : 'Add Sprint Task'}
              </h3>
              <button onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Quarter *</label>
                  <select value={form.quarter} onChange={e => setForm(p => ({ ...p, quarter: Number(e.target.value) }))} className="input text-sm">
                    {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Month *</label>
                  <select value={form.month} onChange={e => setForm(p => ({ ...p, month: Number(e.target.value) }))} className="input text-sm">
                    {[1,2,3].map(m => <option key={m} value={m}>Month {m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Task Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="input text-sm" placeholder="e.g. Set up CRM system" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="input min-h-20 resize-none text-sm"
                  placeholder="What should the founder do for this task?" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : modal === 'edit' ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
