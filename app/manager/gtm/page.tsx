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
  prompt: 'Content Prompt',
  campaign: 'Campaign',
  kpi: 'KPI',
  daily: 'Daily Task',
};

const SECTION_LABELS: Record<GtmSection, string> = {
  guide: 'Left Table',
  plan: 'Middle Table',
  system: 'Right Table',
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, configRes] = await Promise.all([
        axios.get('/api/gtm'),
        axios.get('/api/gtm/config'),
      ]);
      setItems(itemsRes.data.items ?? []);
      setConfig(configRes.data.config ?? null);
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
      toast.error('Title, content and category are required');
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
        toast.success('Updated');
      } else {
        await axios.post('/api/gtm', payload);
        toast.success('Added');
      }
      setModal(null);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      await axios.patch('/api/gtm/config', config);
      toast.success('GTM main page saved');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setSavingConfig(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await axios.delete(`/api/gtm/${id}`);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed');
    }
  };

  const copy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    toast.success('Copied');
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

  return (
    <div className="animate-fade-in">
      <Header title="GTM Manager" subtitle="Edit the whole GTM main page and every item inside the 3 tables" />
      <div className="p-8 space-y-6">
        {config && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Main GTM Page</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hero title, intro, quote and 3 section titles</p>
              </div>
              <button onClick={saveConfig} className="btn-primary flex items-center gap-2" disabled={savingConfig}>
                {savingConfig ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                Save Main Page
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Main Title</label>
                <input value={config.title} onChange={(e) => setConfig((prev) => prev ? { ...prev, title: e.target.value } : prev)} className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Intro Box Text</label>
                <textarea value={config.intro} onChange={(e) => setConfig((prev) => prev ? { ...prev, intro: e.target.value } : prev)} className="input min-h-24 resize-none" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Quote</label>
                <textarea value={config.quote} onChange={(e) => setConfig((prev) => prev ? { ...prev, quote: e.target.value } : prev)} className="input min-h-24 resize-none" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Quote Author</label>
                <input value={config.quoteAuthor} onChange={(e) => setConfig((prev) => prev ? { ...prev, quoteAuthor: e.target.value } : prev)} className="input" />
              </div>
              {config.sections.map((section, index) => (
                <div key={section.key}>
                  <label className="label">Section {index + 1} Title</label>
                  <input
                    value={section.title}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              sections: prev.sections.map((item) =>
                                item.key === section.key ? { ...item, title: e.target.value } : item
                              ),
                            }
                          : prev
                      )
                    }
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="Search GTM items..." />
          </div>
          <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add Item
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
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{section.items.length} items</p>
                  </div>
                  <button onClick={() => openAdd(section.key)} className="btn-secondary text-xs flex items-center gap-2">
                    <Plus size={12} /> Add
                  </button>
                </div>

                <div className="space-y-3">
                  {section.items.length === 0 ? (
                    <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                      <Rocket size={28} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No items here yet</p>
                    </div>
                  ) : (
                    section.items.map((item) => (
                      <div key={item._id} onClick={() => setSelected(item)} className="p-4 rounded-2xl w-full text-left cursor-pointer" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.category} · {TYPE_LABELS[item.type]}</p>
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
                {modal === 'edit' ? 'Edit GTM Item' : 'Add GTM Item'}
              </h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Table</label>
                  <select value={form.section} onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value as GtmSection }))} className="input text-sm">
                    {SECTIONS.map((section) => <option key={section} value={section}>{SECTION_LABELS[section]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as GtmType }))} className="input text-sm">
                    {TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="input text-sm" />
                </div>
                <div>
                  <label className="label">Sort Order</label>
                  <input value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))} className="input text-sm notranslate" translate="no" />
                </div>
              </div>

              <div>
                <label className="label">Title</label>
                <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="input text-sm" />
              </div>

              <div>
                <label className="label">Content</label>
                <textarea value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} className="input min-h-28 resize-none text-sm" />
              </div>

              <div>
                <label className="label">Tags</label>
                <input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} className="input text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : modal === 'edit' ? 'Save Changes' : 'Add Item'}
              </button>
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
              <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
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
