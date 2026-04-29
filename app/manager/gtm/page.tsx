'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Plus, Trash2, Edit2, X, Check, Copy, Search, Rocket, Save } from 'lucide-react';
import { extractKeyValueRows, extractPipeTable, splitContentBlocks } from '@/lib/gtm-display';

const TYPES = ['prompt', 'campaign', 'kpi', 'daily'] as const;
const SECTIONS = ['guide', 'plan', 'system'] as const;
type GtmType = typeof TYPES[number];
type GtmSection = typeof SECTIONS[number];

const TYPE_LABELS: Record<GtmType, string> = {
  prompt: 'Matn andozasi',
  campaign: 'Kampaniya',
  kpi: 'Ko‘rsatkich',
  daily: 'Kunlik vazifa',
};

const SECTION_LABELS: Record<GtmSection, string> = {
  guide: 'Chap jadval',
  plan: 'O‘rta jadval',
  system: 'O‘ng jadval',
};

interface GtmItem {
  _id: string;
  type: GtmType;
  section: GtmSection;
  category: string;
  title: string;
  content: string;
  tags: string[];
  sortOrder?: number;
}

interface GtmConfig {
  title: string;
  intro: string;
  quote: string;
  quoteAuthor: string;
  sections: Array<{ key: GtmSection; title: string }>;
}

const EMPTY = { type: 'prompt' as GtmType, section: 'guide' as GtmSection, category: '', title: '', content: '', tags: '', sortOrder: '0' };

export default function ManagerGtmPage() {
  const [items, setItems] = useState<GtmItem[]>([]);
  const [config, setConfig] = useState<GtmConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<GtmItem | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<GtmItem | null>(null);
  const [progressRows, setProgressRows] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, configRes, progressRes] = await Promise.all([
        axios.get('/api/gtm'),
        axios.get('/api/gtm/config'),
        axios.get('/api/gtm-progress?all=1'),
      ]);
      setItems(itemsRes.data.items ?? []);
      setConfig(configRes.data.config ?? null);
      setProgressRows(progressRes.data.progress ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = (section?: GtmSection) => {
    setForm({ ...EMPTY, section: section || 'guide' });
    setEditItem(null);
    setModal('add');
  };

  const openEdit = (item: GtmItem) => {
    setForm({
      type: item.type,
      section: item.section || 'guide',
      category: item.category,
      title: item.title,
      content: item.content,
      tags: item.tags.join(', '),
      sortOrder: String(item.sortOrder ?? 0),
    });
    setEditItem(item);
    setModal('edit');
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.category.trim()) {
      toast.error('Nomi, matni va toifasi kiritilishi shart');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder || '0'),
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };
      if (modal === 'edit' && editItem) {
        await axios.patch(`/api/gtm/${editItem._id}`, payload);
        toast.success('Yangilandi');
      } else {
        await axios.post('/api/gtm', payload);
        toast.success('Qo‘shildi');
      }
      setModal(null);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      await axios.patch('/api/gtm/config', config);
      toast.success('GTM bosh sahifasi saqlandi');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSavingConfig(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Bu band o‘chirilsinmi?')) return;
    try {
      await axios.delete(`/api/gtm/${id}`);
      toast.success('O‘chirildi');
      load();
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  const copy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    toast.success('Nusxalandi');
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = items.filter((item) =>
    !search ||
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.content.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = SECTIONS.map((sectionKey) => ({
    key: sectionKey,
    title: config?.sections.find((item) => item.key === sectionKey)?.title || SECTION_LABELS[sectionKey],
    items: filtered.filter((item) => (item.section || 'guide') === sectionKey),
  }));
  const tableData = selected ? extractPipeTable(selected.content) : null;
  const keyRows = selected ? extractKeyValueRows(selected.content).slice(0, 6) : [];
  const blocks = selected ? splitContentBlocks(selected.content) : [];
  const totalDone = progressRows.reduce((sum, row) => sum + (row.completed || 0), 0);
  const itemDoneCount = (itemId: string) =>
    progressRows.reduce((sum, row) => {
      const done = (row.recentTasks || []).some((task: any) => String(task.gtmItemId?._id || task.gtmItemId) === itemId && task.completed);
      return sum + (done ? 1 : 0);
    }, 0);
  const reviewGtmProgress = async (progressId: string) => {
    try {
      await axios.patch('/api/gtm-progress', { progressId, reviewed: true });
      toast.success('Ko‘rildi deb belgilandi');
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="GTM boshqaruvi" subtitle="GTM bosh sahifasi va jadval ichidagi har bir vazifani boshqaring" />
      <div className="p-8 space-y-6">
        

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Jami GTM vazifalari', value: items.length },
            { label: 'Bajarilgan natijalar', value: totalDone },
            { label: 'Faol startuplar', value: progressRows.length },
          ].map((item) => (
            <div key={item.label} className="card py-4">
              <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="GTM vazifalarini qidirish..." />
          </div>
          <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Vazifa qo‘shish
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {grouped.map((section) => (
              <div key={section.key} className="card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{section.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{section.items.length} ta vazifa</p>
                  </div>
                  <button onClick={() => openAdd(section.key)} className="btn-secondary text-xs flex items-center gap-2">
                    <Plus size={12} /> Qo‘shish
                  </button>
                </div>

                <div className="space-y-3">
                  {section.items.length === 0 ? (
                    <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                      <Rocket size={28} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bu yerda hozircha vazifa yo‘q</p>
                    </div>
                  ) : (
                    section.items.map((item) => (
                      <div key={item._id} onClick={() => setSelected(item)} className="p-4 rounded-2xl w-full text-left cursor-pointer" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {item.category} · {TYPE_LABELS[item.type]} · {itemDoneCount(item._id)} ta bajarildi
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(event) => { event.stopPropagation(); copy(item.content, item._id); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
                              {copied === item._id ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                            </button>
                            <button onClick={(event) => { event.stopPropagation(); openEdit(item); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-card)', color: 'var(--accent)' }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={(event) => { event.stopPropagation(); remove(item._id); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm mt-3 line-clamp-4" style={{ color: 'var(--text-secondary)' }}>{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {modal === 'edit' ? 'GTM vazifasini tahrirlash' : 'GTM vazifasini qo‘shish'}
              </h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Jadval</label>
                  <select value={form.section} onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value as GtmSection }))} className="input text-sm">
                    {SECTIONS.map((section) => <option key={section} value={section}>{SECTION_LABELS[section]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Turi</label>
                  <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as GtmType }))} className="input text-sm">
                    {TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Toifa</label>
                  <input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="input text-sm" />
                </div>
                <div>
                  <label className="label">Tartib raqami</label>
                  <input value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))} className="input text-sm notranslate" translate="no" />
                </div>
              </div>

              <div>
                <label className="label">Nomi</label>
                <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="input text-sm" />
              </div>

              <div>
                <label className="label">Matni</label>
                <textarea value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} className="input min-h-28 resize-none text-sm" />
              </div>

              <div>
                <label className="label">Belgilar</label>
                <input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} className="input text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Bekor qilish</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : modal === 'edit' ? 'O‘zgarishlarni saqlash' : 'Vazifa qo‘shish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {progressRows.length > 0 && (
        <div className="p-8 pt-0">
          <div className="card space-y-4">
            <div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>GTM natijalari</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Foydalanuvchilar bajargan GTM vazifalari</p>
            </div>

            <div className="space-y-3">
              {progressRows.map((row) => (
                <div key={row.startup._id} className="rounded-2xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.startup.startup_name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {row.completed}/{row.totalTasks} ta bajarildi · {row.pct}%
                      </p>
                    </div>
                    <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                      <div className="h-full" style={{ width: `${row.pct}%`, background: '#10b981' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(row.recentTasks || []).filter((task: any) => task.completed).map((task: any) => (
                      <div key={task._id} className="rounded-xl p-3" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {task.gtmItemId?.title || 'GTM vazifasi'}
                            </p>
                            <p className="text-xs mt-1 leading-5" style={{ color: 'var(--text-muted)' }}>
                              {task.comment}
                            </p>
                          </div>
                          {task.reviewed ? (
                            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                              Ko‘rildi
                            </span>
                          ) : (
                            <button onClick={() => reviewGtmProgress(task._id)} className="btn-secondary text-xs py-1.5">
                              Ko‘rildi
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card w-full max-w-4xl p-8 animate-fade-in">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>{selected.category}</p>
                <h3 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="btn-secondary">Yopish</button>
            </div>

            {keyRows.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {keyRows.map((row) => (
                  <div key={`${row.key}-${row.value}`} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>{row.key}</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-primary)' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            )}

            {tableData && (
              <div className="table-container mb-4">
                <table className="table">
                  <thead>
                    <tr>
                      {tableData.headers.map((header) => <th key={header}>{header}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, index) => (
                      <tr key={`${index}-${row.join('-')}`}>
                        {row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid gap-3">
              {blocks.map((block, index) => (
                <div key={`${index}-${block.slice(0, 12)}`} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-sm whitespace-pre-wrap leading-7" style={{ color: 'var(--text-secondary)' }}>{block}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
