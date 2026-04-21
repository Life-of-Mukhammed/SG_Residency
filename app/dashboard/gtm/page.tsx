'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Check,
  Clock,
  Copy,
  Lock,
  Rocket,
  Star,
  Target,
} from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { useAppStore } from '@/store/appStore';

type Tab = 'daily' | 'prompts' | 'campaigns' | 'kpis';

type GTMItem = {
  _id: string;
  type: 'daily' | 'prompt' | 'campaign' | 'kpi' | string;
  title: string;
  content: string;
  category?: string;
};

export default function GTMPage() {
  const { lang } = useAppStore();
  const [startup, setStartup] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('daily');
  const [copied, setCopied] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState<GTMItem[]>([]);

  const L = {
    subtitle: {
      uz: 'Admin yoki manager qo‘shgan GTM materiallari',
      ru: 'GTM-материалы, добавленные админом или менеджером',
      en: 'GTM materials added by admin or manager',
    },
    daily: { uz: 'Kunlik tizim', ru: 'Ежедневная система', en: 'Daily System' },
    prompts: { uz: 'Kontent banki', ru: 'Банк контента', en: 'Content Bank' },
    campaigns: { uz: 'Kampaniyalar', ru: 'Кампании', en: 'Campaigns' },
    kpis: { uz: 'KPIlar', ru: 'KPI', en: 'KPIs' },
    custom: { uz: 'Custom', ru: 'Custom', en: 'Custom' },
    lockedTitle: { uz: 'GTM hozircha yopiq', ru: 'GTM пока закрыт', en: 'GTM is locked' },
    lockedText: {
      uz: 'Startup tasdiqlangandan keyin GTM bo‘limi ochiladi.',
      ru: 'Раздел GTM откроется после одобрения стартапа.',
      en: 'GTM opens after your startup is approved.',
    },
    emptyTitle: {
      uz: 'Bu bo‘limda hozircha material yo‘q',
      ru: 'В этом разделе пока нет материалов',
      en: 'No materials in this section yet',
    },
    emptyText: {
      uz: 'Admin yoki manager item qo‘shganda shu yerda chiqadi.',
      ru: 'Материалы появятся здесь, когда админ или менеджер их добавит.',
      en: 'Items will appear here when admin or manager adds them.',
    },
    copied: { uz: 'Nusxa olindi!', ru: 'Скопировано!', en: 'Copied!' },
  };

  const t = (key: keyof typeof L) => L[key][lang] ?? L[key].en;

  useEffect(() => {
    axios
      .get('/api/gtm')
      .then((response) => setCustomItems(response.data.items ?? []))
      .catch(() => {});

    axios
      .get('/api/startups?limit=1')
      .then((response) => setStartup(response.data.startups?.[0] ?? null))
      .catch(() => {});
  }, []);

  const itemsByTab = useMemo(
    () => ({
      daily: customItems.filter((item) => item.type === 'daily'),
      prompts: customItems.filter((item) => item.type === 'prompt'),
      campaigns: customItems.filter((item) => item.type === 'campaign'),
      kpis: customItems.filter((item) => item.type === 'kpi'),
    }),
    [customItems]
  );

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success(t('copied'));
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'daily', label: t('daily'), icon: <Clock size={15} /> },
    { id: 'prompts', label: t('prompts'), icon: <Rocket size={15} /> },
    { id: 'campaigns', label: t('campaigns'), icon: <Target size={15} /> },
    { id: 'kpis', label: t('kpis'), icon: <BarChart3 size={15} /> },
  ];

  const activeItems = itemsByTab[tab];

  return (
    <div className="animate-fade-in">
      <Header title="GTM" subtitle={t('subtitle')} />

      {startup && startup.status !== 'active' ? (
        <div className="p-6">
          <div className="card max-w-2xl mx-auto text-center py-14">
            <Rocket size={34} className="mx-auto mb-4" style={{ color: '#f59e0b' }} />
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
          <div
            className="flex gap-1.5 p-1 rounded-xl w-fit"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {tabs.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === tabItem.id ? 'var(--accent)' : 'transparent',
                  color: tab === tabItem.id ? 'white' : 'var(--text-muted)',
                }}
              >
                {tabItem.icon} {tabItem.label}
              </button>
            ))}
          </div>

          {activeItems.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {activeItems.map((item) => (
                <div
                  key={item._id}
                  className="card"
                  style={{ border: '1.5px solid rgba(99,102,241,0.18)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className="badge text-xs flex items-center gap-0.5"
                          style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
                        >
                          <Star size={9} /> {t('custom')}
                        </span>
                        {item.category ? <span className="badge badge-mvp text-xs">{item.category}</span> : null}
                      </div>

                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {item.content}
                      </p>
                    </div>

                    <button
                      onClick={() => copyText(item.content, item._id)}
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                    >
                      {copied === item._id ? (
                        <Check size={14} style={{ color: '#10b981' }} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
