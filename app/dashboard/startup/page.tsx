'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import {
  Rocket, Globe, Users, DollarSign, Phone, MessageCircle,
  FileText, Edit2, ArrowRight, TrendingUp, Target
} from 'lucide-react';
import { format } from 'date-fns';

export default function MyStartupPage() {
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/startups?limit=1')
      .then(res => setStartup(res.data.startups?.[0] ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
    { label: 'MRR',               value: `$${startup.mrr?.toLocaleString() ?? 0}`,              icon: <DollarSign size={18} />, color: '#10b981' },
    { label: 'Users',             value: startup.users_count?.toLocaleString() ?? '0',           icon: <Users size={18} />,      color: '#6366f1' },
    { label: 'Investment Raised', value: `$${startup.investment_raised?.toLocaleString() ?? 0}`, icon: <TrendingUp size={18} />, color: '#f59e0b' },
    { label: 'Team Size',         value: startup.team_size ?? '—',                              icon: <Users size={18} />,      color: '#ec4899' },
  ];

  return (
    <div className="animate-fade-in">
      <Header title={startup.startup_name} subtitle={`${startup.startup_sphere} · ${startup.region}`} />
      <div className="p-8 max-w-3xl mx-auto space-y-6">

        {/* Hero */}
        <div className="card">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {startup.startup_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {startup.startup_name}
                </h2>
                <span className={`badge badge-${startup.status}`}>{startup.status}</span>
                <span className={`badge badge-${startup.stage}`}>{startup.stage}</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {startup.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={13} /> {startup.phone}
                </div>
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <MessageCircle size={13} /> {startup.telegram}
                </div>
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Globe size={13} /> {startup.gmail}
                </div>
                {startup.pitch_deck && (
                  <a href={startup.pitch_deck} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--accent)' }}>
                    <FileText size={13} /> Pitch Deck
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(({ label, value, icon, color }) => (
            <div key={label} className="card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${color}22`, color }}>
                {icon}
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs mt-1"        style={{ color: 'var(--text-muted)'    }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Startup Details</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Founder',     value: startup.founder_name },
              { label: 'Region',      value: startup.region },
              { label: 'Sphere',      value: startup.startup_sphere },
              { label: 'Stage',       value: startup.stage },
              { label: 'Commitment',  value: startup.commitment },
              { label: 'Team Size',   value: `${startup.team_size} people` },
              { label: 'Applied',     value: format(new Date(startup.createdAt), 'MMM d, yyyy') },
              { label: 'Status',      value: startup.status },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Sprint Roadmap', desc: 'Track your task progress', href: '/dashboard/sprint',     icon: <Target size={18} />,   color: '#6366f1' },
            { label: 'Submit Report',  desc: 'Weekly progress update',   href: '/dashboard/reports/new',icon: <FileText size={18} />, color: '#10b981' },
            { label: 'Book Meeting',   desc: 'Schedule with manager',    href: '/dashboard/meetings',   icon: <Globe size={18} />,    color: '#f59e0b' },
          ].map(({ label, desc, href, icon, color }) => (
            <Link key={label} href={href}>
              <div className="card cursor-pointer group flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}22`, color }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs"               style={{ color: 'var(--text-muted)'    }}>{desc}</p>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }}
                  className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
