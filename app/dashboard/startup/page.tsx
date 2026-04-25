'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import {
  Rocket, Globe, Users, DollarSign, Phone, MessageCircle,
  FileText, ArrowRight, TrendingUp, Target, Edit2, X, Save
} from 'lucide-react';
import { format } from 'date-fns';

type StartupForm = {
  startup_name: string;
  pitch_deck: string;
  mrr: string;
  users_count: string;
  investment_raised: string;
  team_size: string;
};

export default function MyStartupPage() {
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StartupForm>({
    startup_name: '',
    pitch_deck: '',
    mrr: '0',
    users_count: '0',
    investment_raised: '0',
    team_size: '1',
  });

  const loadStartup = async () => {
    const res = await axios.get('/api/startups?limit=1');
    const current = res.data.startups?.[0] ?? null;
    setStartup(current);
    if (current) {
      setForm({
        startup_name: current.startup_name || '',
        pitch_deck: current.pitch_deck || '',
        mrr: String(current.mrr ?? 0),
        users_count: String(current.users_count ?? 0),
        investment_raised: String(current.investment_raised ?? 0),
        team_size: String(current.team_size ?? 1),
      });
    }
  };

  useEffect(() => {
    loadStartup()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!startup?._id) return;
    setSaving(true);
    try {
      await axios.patch(`/api/startups/${startup._id}`, {
        startup_name: form.startup_name,
        pitch_deck: form.pitch_deck,
        mrr: Number(form.mrr),
        users_count: Number(form.users_count),
        investment_raised: Number(form.investment_raised),
        team_size: Number(form.team_size),
      });
      toast.success('Startup updated');
      setEditing(false);
      await loadStartup();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div>
      <Header title="My Startup" />
      <div className="p-8 space-y-4 max-w-3xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!startup) return (
    <div className="animate-fade-in">
      <Header title="My Startup" subtitle="You haven't applied yet" />
      <div className="p-8 max-w-2xl mx-auto">
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Rocket size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            No startup yet
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Apply to the residency program to get started
          </p>
          <Link href="/dashboard/apply">
            <button className="btn-primary flex items-center gap-2 mx-auto">
              <Rocket size={16} /> Apply Now <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  const metrics = [
    { label: 'MRR', value: `$${startup.mrr?.toLocaleString() ?? 0}`, icon: <DollarSign size={18} />, color: '#10b981', noTranslate: true },
    { label: 'Users', value: startup.users_count?.toLocaleString() ?? '0', icon: <Users size={18} />, color: '#6366f1' },
    { label: 'Investment Raised', value: `$${startup.investment_raised?.toLocaleString() ?? 0}`, icon: <TrendingUp size={18} />, color: '#f59e0b', noTranslate: true },
    { label: 'Team Size', value: startup.team_size ?? '—', icon: <Users size={18} />, color: '#ec4899' },
  ];

  const isApproved = startup.status === 'active';

  return (
    <div className="animate-fade-in">
      <Header title={startup.startup_name} subtitle={`${startup.startup_sphere} · ${startup.region}`} />
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="card">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {startup.startup_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  <span className="notranslate" translate="no">{startup.startup_name}</span>
                </h2>
                <span className={`badge badge-${startup.status}`}>{startup.status}</span>
                <span className={`badge badge-${startup.stage}`}>{startup.stage}</span>
              </div>
              {startup.status === 'rejected' && startup.rejectionReason && (
                <div
                  className="rounded-2xl p-4 mb-4"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: '#ef4444' }}>
                    Reject Reason
                  </p>
                  <p className="text-sm leading-6" style={{ color: 'var(--text-primary)' }}>
                    {startup.rejectionReason}
                  </p>
                </div>
              )}
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {startup.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={13} /> <span className="notranslate" translate="no">{startup.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <MessageCircle size={13} /> <span className="notranslate" translate="no">{startup.telegram}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Globe size={13} /> <span className="notranslate" translate="no">{startup.gmail}</span>
                </div>
                {startup.pitch_deck && (
                  <a href={startup.pitch_deck} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--accent)' }}>
                    <FileText size={13} /> Pitch Deck
                  </a>
                )}
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2">
              <Edit2 size={14} /> Edit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(({ label, value, icon, color, noTranslate }) => (
            <div key={label} className="card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${color}22`, color }}>
                {icon}
              </div>
              <p className={`text-xl font-bold ${noTranslate ? 'notranslate' : ''}`} translate={noTranslate ? 'no' : undefined} style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Startup Details</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Your role', value: startup.founder_name, noTranslate: true },
              { label: 'Region', value: startup.region },
              { label: 'Sphere', value: startup.startup_sphere },
              { label: 'Stage', value: startup.stage },
              { label: 'Commitment', value: startup.commitment },
              { label: 'Team Size', value: `${startup.team_size} people` },
              { label: 'Applied', value: format(new Date(startup.createdAt), 'MMM d, yyyy') },
              { label: 'Status', value: startup.status },
            ].map(({ label, value, noTranslate }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className={`text-sm font-medium capitalize ${noTranslate ? 'notranslate' : ''}`} translate={noTranslate ? 'no' : undefined} style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Sprint Roadmap', desc: isApproved ? 'Track your task progress' : 'Unlocks after approval', href: isApproved ? '/dashboard/sprint' : '/dashboard/settings', icon: <Target size={18} />, color: '#6366f1' },
            { label: 'Submit Report', desc: isApproved ? 'Weekly progress update' : 'Unlocks after approval', href: isApproved ? '/dashboard/reports/new' : '/dashboard/settings', icon: <FileText size={18} />, color: '#10b981' },
            { label: 'Book Meeting', desc: isApproved ? 'Schedule with manager' : 'Unlocks after approval', href: isApproved ? '/dashboard/meetings' : '/dashboard/settings', icon: <Globe size={18} />, color: '#f59e0b' },
          ].map(({ label, desc, href, icon, color }) => (
            <Link key={label} href={href}>
              <div className="card cursor-pointer group flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22`, color }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
          <div className="card w-full max-w-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Startup</h3>
              <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Startup Name</label>
                <input value={form.startup_name} onChange={(e) => setForm((prev) => ({ ...prev, startup_name: e.target.value }))} className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Pitch Deck URL</label>
                <input value={form.pitch_deck} onChange={(e) => setForm((prev) => ({ ...prev, pitch_deck: e.target.value }))} className="input notranslate" translate="no" />
              </div>
              <div>
                <label className="label">MRR</label>
                <input type="number" min="0" value={form.mrr} onChange={(e) => setForm((prev) => ({ ...prev, mrr: e.target.value }))} className="input notranslate" translate="no" />
              </div>
              <div>
                <label className="label">Users</label>
                <input type="number" min="0" value={form.users_count} onChange={(e) => setForm((prev) => ({ ...prev, users_count: e.target.value }))} className="input notranslate" translate="no" />
              </div>
              <div>
                <label className="label">Investment Raised</label>
                <input type="number" min="0" value={form.investment_raised} onChange={(e) => setForm((prev) => ({ ...prev, investment_raised: e.target.value }))} className="input notranslate" translate="no" />
              </div>
              <div>
                <label className="label">Team Size</label>
                <input type="number" min="1" value={form.team_size} onChange={(e) => setForm((prev) => ({ ...prev, team_size: e.target.value }))} className="input notranslate" translate="no" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
