'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Header from '@/components/dashboard/Header';
import { CheckCircle2, Lock, PartyPopper, Sparkles, Star, Layers3, Bookmark, FileText, Rocket, X, ChevronRight } from 'lucide-react';
import { isGtmUnlockedBySprint } from '@/lib/sprint-unlock';

type GTMItem = {
  _id: string;
  section?: 'guide' | 'plan' | 'system';
  title: string;
  content: string;
  category?: string;
};

type GTMConfig = {
  title: string;
  intro: string;
  quote: string;
  quoteAuthor: string;
  sections: Array<{ key: 'guide' | 'plan' | 'system'; title: string }>;
};

export default function GTMPage() {
  const [startup, setStartup] = useState<any>(null);
  const [items, setItems] = useState<GTMItem[]>([]);
  const [config, setConfig] = useState<GTMConfig | null>(null);
  const [sprintTasks, setSprintTasks] = useState<any[]>([]);
  const [progressItems, setProgressItems] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GTMItem | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [startupRes, itemsRes, configRes, sprintTaskRes, progressRes] = await Promise.all([
          axios.get('/api/startups?limit=1'),
          axios.get('/api/gtm'),
          axios.get('/api/gtm/config'),
          axios.get('/api/sprint-tasks'),
          axios.get('/api/sprints'),
        ]);
        const currentStartup = startupRes.data.startups?.[0] ?? null;
        setStartup(currentStartup);
        setItems(itemsRes.data.items ?? []);
        setConfig(configRes.data.config ?? null);
        setSprintTasks(sprintTaskRes.data.tasks ?? []);
        setProgressItems(progressRes.data.tasks ?? []);
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  const unlockedBySprint = useMemo(
    () => isGtmUnlockedBySprint(sprintTasks, progressItems),
    [progressItems, sprintTasks]
  );

  const canAccess = unlockedBySprint;

  useEffect(() => {
    if (!startup?._id || !canAccess) return;
    const key = `gtm-celebrated-${startup._id}`;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, '1');
    setShowCelebration(true);
    const timeout = window.setTimeout(() => setShowCelebration(false), 4200);
    return () => window.clearTimeout(timeout);
  }, [canAccess, startup?._id]);

  const sections = config?.sections ?? [];
  const grouped = {
    guide: items.filter((item) => (item.section || 'guide') === 'guide'),
    plan: items.filter((item) => (item.section || 'guide') === 'plan'),
    system: items.filter((item) => (item.section || 'guide') === 'system'),
  };

  const totalItems = items.length;
  const selectedSectionTitles = {
    guide: sections.find((section) => section.key === 'guide')?.title || 'Guide',
    plan: sections.find((section) => section.key === 'plan')?.title || 'Plan',
    system: sections.find((section) => section.key === 'system')?.title || 'System',
  };

  return (
    <div
      className="animate-fade-in min-h-screen"
      style={{
        background:
          'radial-gradient(circle at 12% 12%, rgba(99,102,241,0.14), transparent 18%), radial-gradient(circle at 88% 12%, rgba(16,185,129,0.12), transparent 18%), radial-gradient(circle at 50% 92%, rgba(99,102,241,0.1), transparent 20%)',
      }}
    >
      <Header title="GTM" subtitle="Unlocks after completing all tasks in Sprint months 1–3" />

      {!canAccess ? (
        <div className="px-4 py-16 flex justify-center">
          <div className="card w-full max-w-xl text-center px-8 py-12 space-y-5">
            <Lock size={34} className="mx-auto" style={{ color: '#f59e0b' }} />

            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              GTM is locked
            </p>

            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              GTM unlocks after all tasks in Sprint months 1, 2, and 3 are completed.
            </p>

            <div className="pt-2">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}
              >
                <CheckCircle2 size={14} />
                Application sent: {startup ? 'Yes' : 'No'} · First 3 months complete: {unlockedBySprint ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-8 md:px-6 md:py-10">
          <div className="max-w-7xl mx-auto space-y-12">

            {showCelebration && (
              <div className="card px-6 py-5 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none animate-pulse" style={{ background: 'radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 45%)' }} />

                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <PartyPopper size={22} style={{ color: 'var(--text-primary)' }} />
                </div>

                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    GTM unlocked
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    First 3 sprint months are done. Time to execute your GTM plan.
                  </p>
                </div>
              </div>
            )}

            <section className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.8fr] gap-6 items-start">
              <div
                className="card relative overflow-hidden p-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 22%), radial-gradient(circle at bottom right, rgba(16,185,129,0.14), transparent 24%)',
                  }}
                />

                <div className="relative px-6 py-8 md:px-8 md:py-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <Rocket size={20} style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--accent)' }}>
                        Founder Growth Engine
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Structured playbook for visibility, trust and momentum
                      </p>
                    </div>
                  </div>

                  <div className="max-w-4xl space-y-5">
                    <h1 className="text-4xl md:text-6xl font-black leading-[0.98]" style={{ color: 'var(--text-primary)' }}>
                      {config?.title || '90 Kunlik GTM'}
                    </h1>
                    <p className="text-base md:text-lg leading-8 max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
                      {config?.intro}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_0.95fr] gap-5">
                    <div
                      className="rounded-3xl p-5"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles size={18} style={{ color: '#facc15', marginTop: 4 }} />
                        <div className="space-y-3">
                          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                            Core Thesis
                          </p>
                          <p className="text-base leading-8 font-medium" style={{ color: 'var(--text-primary)' }}>
                            “{config?.quote}”
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            — {config?.quoteAuthor}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-3">
                      {[
                        { label: 'Total Cards', value: totalItems, note: 'All GTM assets' },
                        { label: 'Unlocked', value: 'Yes', note: 'Sprint months 1–3 completed' },
                        { label: 'Startup', value: startup?.startup_name || 'Draft', note: startup?.region || 'No region yet' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl px-4 py-4"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                            {item.label}
                          </p>
                          <p className="text-2xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>
                            {item.value}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {item.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: selectedSectionTitles.guide, value: grouped.guide.length, icon: <Bookmark size={16} />, detail: 'Frameworks, prompts and mental models' },
                  { label: selectedSectionTitles.plan, value: grouped.plan.length, icon: <Layers3 size={16} />, detail: 'Execution steps and rollout direction' },
                  { label: selectedSectionTitles.system, value: grouped.system.length, icon: <FileText size={16} />, detail: 'Repeatable operating system and routines' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="card px-5 py-5"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {item.icon}
                      </div>
                      <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                    </div>
                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                      <p className="text-sm mt-2 leading-6" style={{ color: 'var(--text-secondary)' }}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
              {sections.map((section) => (
                <div
                  key={section.key}
                  className="card p-0 overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                  }}
                >
                  <div
                    className="px-5 py-5 border-b"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                      <Star size={15} style={{ color: 'var(--accent)' }} />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {section.title}
                        </h2>
                        <p className="text-xs mt-1 uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                          {(grouped[section.key] || []).length} cards
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {(grouped[section.key] || []).map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="w-full text-left rounded-3xl px-4 py-4 group transition-all hover:scale-[1.01]"
                        style={{
                          background: 'rgba(255,255,255,0.035)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(16,185,129,0.16))',
                            }}
                          >
                            <Star size={14} style={{ color: 'var(--accent)' }} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-primary)' }}>
                              {item.title}
                              </p>
                              <ChevronRight size={14} className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                            </div>

                            {item.category && (
                              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                {item.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}

                    {(grouped[section.key] || []).length === 0 && (
                      <div
                        className="rounded-3xl px-5 py-8 text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
                      >
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          No GTM items in this section yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}

      {/* GTM Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(12px)' }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="card w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b flex items-start justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(16,185,129,0.2))' }}>
                  <Star size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{selectedItem.title}</h3>
                  {selectedItem.category && (
                    <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
                      {selectedItem.category}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-1">
              <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {selectedItem.content}
              </p>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                {selectedItem.section?.toUpperCase() || 'GUIDE'}
              </span>
              <button onClick={() => setSelectedItem(null)} className="btn-secondary text-sm py-2">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
