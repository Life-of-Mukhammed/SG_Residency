'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Plus, Trash2, Edit2, X, Check, Copy, Search, Rocket } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const TYPES = ['prompt', 'campaign', 'kpi', 'daily'] as const;
type GtmType = typeof TYPES[number];

const TYPE_LABELS: Record<GtmType, string> = {
  prompt:   '📝 Content Prompt',
  campaign: '🎯 Campaign',
  kpi:      '📊 KPI',
  daily:    '⏰ Daily Task',
};

const CATEGORIES: Record<GtmType, string[]> = {
  prompt:   ['Social Media','Email','Content','Community','Paid'],
  campaign: ['Launch','Growth','Outbound','Retention','Brand'],
  kpi:      ['Revenue','Users','Engagement','Conversion','Retention'],
  daily:    ['Morning','Deep Work','Sales','Marketing','Review'],
};

interface GtmItem {
  _id: string;
  type: GtmType;
  category: string;
  title: string;
  content: string;
  tags: string[];
  createdBy?: { name: string; surname: string };
  createdAt: string;
}

const EMPTY = { type: 'prompt' as GtmType, category: '', title: '', content: '', tags: '' };

export default function ManagerGtmPage() {
  const { lang } = useAppStore();
  const [items, setItems]       = useState<GtmItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [typeFilter, setTypeFilter] = useState<GtmType | ''>('');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState<'add' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<GtmItem | null>(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/gtm${typeFilter ? `?type=${typeFilter}` : ''}`);
      setItems(res.data.items ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY);
    setEditItem(null);
    setModal('add');
  };

  const openEdit = (item: GtmItem) => {
    setForm({ type: item.type, category: item.category, title: item.title, content: item.content, tags: item.tags.join(', ') });
    setEditItem(item);
    setModal('edit');
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.category) {
      toast.error(t('required'));
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (modal === 'edit' && editItem) {
        await axios.patch(`/api/gtm/${editItem._id}`, payload);
        toast.success(t('updated'));
      } else {
        await axios.post('/api/gtm', payload);
        toast.success(t('added'));
      }
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('failed'));
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await axios.delete(`/api/gtm/${id}`);
      toast.success(t('deleted'));
      load();
    } catch { toast.error(t('failed')); }
  };

  const copy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    toast.success(t('copied'));
    setTimeout(() => setCopied(null), 2000);
  };

  const T = {
    title: { uz: 'GTM Menejeri', ru: 'GTM Менеджер', en: 'GTM Manager' },
    subtitle: { uz: 'Promptlar, kampaniyalar, KPI va kunlik vazifalarni boshqaring', ru: 'Управляйте промптами, кампаниями, KPI и ежедневными задачами', en: 'Manage content prompts, campaigns, KPIs and daily tasks' },
    search: { uz: 'Elementlarni qidirish...', ru: 'Поиск элементов...', en: 'Search items...' },
    all: { uz: 'Barchasi', ru: 'Все', en: 'All' },
    addItem: { uz: "Element qo'shish", ru: 'Добавить элемент', en: 'Add Item' },
    required: { uz: 'Sarlavha, kontent va kategoriya kerak', ru: 'Название, контент и категория обязательны', en: 'Title, content and category are required' },
    updated: { uz: 'Yangilandi', ru: 'Обновлено', en: 'Updated!' },
    added: { uz: "Qo'shildi", ru: 'Добавлено', en: 'Added!' },
    failed: { uz: 'Xatolik yuz berdi', ru: 'Произошла ошибка', en: 'Failed' },
    deleted: { uz: "O'chirildi", ru: 'Удалено', en: 'Deleted' },
    copied: { uz: 'Nusxa olindi', ru: 'Скопировано', en: 'Copied!' },
    deleteConfirm: { uz: "Bu element o'chirilsinmi?", ru: 'Удалить этот элемент?', en: 'Delete this item?' },
    noItems: { uz: "Hozircha elementlar yo'q", ru: 'Пока элементов нет', en: 'No items yet' },
    addFirst: { uz: 'Birinchi GTM elementini qo‘shing', ru: 'Добавьте первый GTM элемент', en: 'Add your first GTM item' },
    editItem: { uz: 'Elementni tahrirlash', ru: 'Редактировать элемент', en: 'Edit Item' },
    addGtmItem: { uz: "GTM elementi qo'shish", ru: 'Добавить GTM элемент', en: 'Add GTM Item' },
    type: { uz: 'Turi', ru: 'Тип', en: 'Type' },
    category: { uz: 'Kategoriya', ru: 'Категория', en: 'Category' },
    select: { uz: 'Tanlang...', ru: 'Выберите...', en: 'Select...' },
    itemTitle: { uz: 'Sarlavha', ru: 'Заголовок', en: 'Title' },
    content: { uz: 'Kontent', ru: 'Контент', en: 'Content' },
    tags: { uz: 'Teglar (vergul bilan)', ru: 'Теги (через запятую)', en: 'Tags (comma separated)' },
    cancel: { uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' },
    saveChanges: { uz: "O'zgarishlarni saqlash", ru: 'Сохранить изменения', en: 'Save Changes' },
    itemStats: { uz: 'element', ru: 'элементов', en: 'items' },
  };
  const t = (key: keyof typeof T) => T[key][lang] ?? T[key].en;

  const filtered = items.filter(item =>
    !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <Header title={t('title')} subtitle={t('subtitle')} />
      <div className="p-8 space-y-6">

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9 text-sm" placeholder={t('search')} />
          </div>

          <div className="flex gap-2">
            {(['', ...TYPES] as const).map(typeOption => (
              <button key={typeOption || 'all'}
                onClick={() => setTypeFilter(typeOption as GtmType | '')}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: typeFilter === typeOption ? 'var(--accent)' : 'var(--bg-card)',
                  color:      typeFilter === typeOption ? 'white'         : 'var(--text-muted)',
                  border:     '1px solid var(--border)',
                }}>
                {typeOption ? TYPE_LABELS[typeOption as GtmType].split(' ')[1] : t('all')}
              </button>
            ))}
          </div>

          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> {t('addItem')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TYPES.map(t => (
            <div key={t} className="card py-3 text-center cursor-pointer" onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
              style={{ border: typeFilter === t ? '1.5px solid var(--accent)' : undefined }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {items.filter(i => i.type === t).length}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[t]}</p>
            </div>
          ))}
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Rocket size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('noItems')}</p>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>{t('addFirst')}</p>
            <button onClick={openAdd} className="btn-primary mx-auto flex items-center gap-2">
              <Plus size={15} /> {t('addItem')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(item => (
              <div key={item._id} className="card group relative">
                {/* Type badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-mvp text-xs">{item.category}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[item.type]}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => copy(item.content, item._id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                      {copied === item._id ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--accent)' }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => remove(item._id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.content}</p>

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-lg animate-fade-in">
                <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {modal === 'edit' ? t('editItem') : t('addGtmItem')}
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
                  <label className="label">{t('type')} *</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as GtmType, category: '' }))} className="input text-sm">
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('category')} *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input text-sm">
                    <option value="">{t('select')}</option>
                    {(CATEGORIES[form.type] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">{t('itemTitle')} *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="input text-sm" placeholder="e.g. LinkedIn founder story post" />
              </div>

              <div>
                <label className="label">{t('content')} *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  className="input min-h-24 resize-none text-sm"
                  placeholder="Write the prompt, description, or content here..." />
              </div>

              <div>
                <label className="label">{t('tags')}</label>
                <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  className="input text-sm" placeholder="linkedin, founder, story" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : modal === 'edit' ? t('saveChanges') : t('addItem')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
