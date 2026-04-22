'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAppStore } from '@/store/appStore';

const ALLOWED_PATHS = ['/dashboard', '/dashboard/apply'];

export default function ResidencyAccessGate() {
  const pathname = usePathname();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const hydrated = useAppStore((state) => state._hydrated);
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [startupStatus, setStartupStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/startups?limit=1');
        setStartupStatus(res.data.startups?.[0]?.status ?? null);
      } catch {
        setStartupStatus(null);
      } finally {
        setChecking(false);
      }
    };

    load();
  }, []);

  if (!mounted || checking || startupStatus === 'active' || ALLOWED_PATHS.includes(pathname)) return null;

  const left = hydrated ? (sidebarOpen ? 240 : 64) : 240;

  return (
    <div
      className="fixed top-0 bottom-0 z-20 flex items-center justify-center p-6"
      style={{
        left,
        right: 0,
        background: 'rgba(15,23,42,0.68)',
        backdropFilter: 'blur(6px) grayscale(0.25)',
      }}
    >
      <div className="card max-w-lg text-center py-12 px-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(99,102,241,0.14)' }}
        >
          <Lock size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Apply to Residency First
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Apply to residency first. Sprint, GTM and the rest of the workspace unlock after approval.
        </p>
        <Link href="/dashboard/apply">
          <button className="btn-primary inline-flex items-center gap-2">
            <Rocket size={15} /> Open Application
          </button>
        </Link>
      </div>
    </div>
  );
}
