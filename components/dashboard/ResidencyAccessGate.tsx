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
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/startups?limit=1');
        const startup = res.data.startups?.[0] ?? null;
        setStartupStatus(startup?.status ?? null);
        setRejectionReason(startup?.rejectionReason ?? '');
      } catch {
        setStartupStatus(null);
        setRejectionReason('');
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
          {startupStatus === 'rejected' ? 'Application Rejected' : startupStatus === 'pending' ? 'Application On Progress' : 'Apply to Residency First'}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {startupStatus === 'rejected'
            ? 'Sizning arizangiz rad etilgan. Dashboard approval bo‘lmaguncha ochilmaydi.'
            : startupStatus === 'pending'
              ? 'Arizangiz yuborilgan. Hozir admin yoki manager review qilmoqda. Accept bo‘lgandan keyin dashboard ochiladi.'
              : 'Apply to residency first. Sprint, GTM and the rest of the workspace unlock after approval.'}
        </p>
        {startupStatus === 'rejected' && rejectionReason && (
          <div
            className="rounded-2xl p-4 mb-6 text-left"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
          >
            <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: '#ef4444' }}>
              Reject Reason
            </p>
            <p className="text-sm leading-6" style={{ color: 'var(--text-primary)' }}>
              {rejectionReason}
            </p>
          </div>
        )}
        <Link href="/dashboard/apply">
          <button className="btn-primary inline-flex items-center gap-2">
            <Rocket size={15} /> {startupStatus ? 'Open Application' : 'Open Application'}
          </button>
        </Link>
      </div>
    </div>
  );
}
