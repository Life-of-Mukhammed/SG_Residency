'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Header from '@/components/dashboard/Header';
import { CheckCircle2, Copy, Lock, PartyPopper, Sparkles, Star } from 'lucide-react';
import toast from 'react-hot-toast';
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
  const [selected, setSelected] = useState<GTMItem | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

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

  const canAccess = startup?.status === 'active' && unlockedBySprint;

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

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <div
      className="animate-fade-in min-h-screen"
      style={{
        background:
          'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 24%), radial-gradient(circle at right, rgba(16,185,129,0.12), transparent 20%)',
      }}
    >
      <Header title="GTM" subtitle="Your GTM workspace unlocks after Sprint month 3" />

      {!canAccess ? (
        <div className="px-4 py-16 flex justify-center">
          <div className="card w-full max-w-xl text-center px-8 py-12 space-y-5">
            <Lock size={34} className="mx-auto" style={{ color: '#f59e0b' }} />

            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              GTM is locked
            </p>

            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              GTM opens only after your residency is approved and all tasks in Sprint months 1, 2 and 3 are completed.
            </p>

            <div className="pt-2">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}
              >
                <CheckCircle2 size={14} />
                Approved: {startup?.status === 'active' ? 'Yes' : 'No'} · First 3 months complete: {unlockedBySprint ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-10">
          <div className="max-w-6xl mx-auto space-y-12">

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

            <div className="space-y-8 max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                {config?.title || '90 Kunlik GTM'}
              </h1>

              <div className="card px-6 py-5 flex items-start gap-4">
                <Sparkles size={20} style={{ color: '#facc15', marginTop: 4 }} />
                <p className="text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
                  {config?.intro}
                </p>
              </div>

              <blockquote className="border-l-4 pl-6 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.7)' }}>
                <p className="text-xl font-semibold leading-8" style={{ color: 'var(--text-primary)' }}>
                  “{config?.quote}”
                </p>
                <footer className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  — {config?.quoteAuthor}
                </footer>
              </blockquote>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {sections.map((section) => (
                <div key={section.key} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                      <Star size={15} style={{ color: 'var(--accent)' }} />
                    </div>

                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {section.title}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {(grouped[section.key] || []).map((item) => (
                      <button
                        key={item._id}
                        onClick={() => setSelected(item)}
                        className="w-full text-left card px-4 py-4 group transition-all duration-300 hover:-translate-y-1"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          boxShadow: '0 18px 40px rgba(15,23,42,0.22)',
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
                            <p className="text-base font-semibold group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-primary)' }}>
                              {item.title}
                            </p>

                            {item.category && (
                              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                {item.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
        >
          <div className="card w-full max-w-xl p-6 space-y-5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                  {selected.category || 'GTM Item'}
                </p>
                <h3 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {selected.title}
                </h3>
              </div>

              <div className="flex gap-2">
                <button onClick={() => copyText(selected.content)} className="btn-secondary">
                  <Copy size={14} />
                </button>
                <button onClick={() => setSelected(null)} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {selected.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}