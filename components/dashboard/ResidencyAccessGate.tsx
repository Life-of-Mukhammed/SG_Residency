'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/appStore';

const ALLOWED_PATHS = ['/dashboard', '/dashboard/apply'];
const INTERVIEW_ALLOWED = ['/dashboard', '/dashboard/meetings', '/dashboard/startup', '/dashboard/settings'];

export default function ResidencyAccessGate() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const hydrated = useAppStore((state) => state._hydrated);
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [startupStatus, setStartupStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const role = (session?.user as any)?.role;
  const isStaff = role && role !== 'user';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isStaff) { setChecking(false); return; }
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
  }, [isStaff]);

  if (
    !mounted ||
    checking ||
    isStaff ||
    startupStatus === 'active' ||
    ALLOWED_PATHS.includes(pathname) ||
    (startupStatus === 'lead_accepted' && INTERVIEW_ALLOWED.includes(pathname))
  ) return null;

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
          {startupStatus === 'rejected'
            ? 'Ariza rad etildi'
            : startupStatus === 'lead_accepted'
              ? 'Intervyu bosqichi faoldir'
              : startupStatus === 'pending'
                ? 'Ariza ko\'rib chiqilmoqda'
                : 'Rezidentlikka ariza topshiring'}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {startupStatus === 'rejected'
            ? 'Arizangiz rad etildi. Ish muhiti ariza tasdiqlanguncha qulflangan bo\'lib qoladi.'
            : startupStatus === 'lead_accepted'
              ? 'Leadingiz birinchi tekshiruvdan o\'tdi. Hozircha faqat uchrashuvlar ochiq — intervyu belgilashingiz mumkin.'
              : startupStatus === 'pending'
                ? 'Arizangiz muvaffaqiyatli yuborildi. Menejer yoki admin ko\'rib chiqishi hali davom etmoqda.'
                : 'Avval rezidentlik arizangizni topshiring. Ish muhiti tasdiqdan so\'ng ochiladi.'}
        </p>
        {startupStatus === 'rejected' && rejectionReason && (
          <div
            className="rounded-2xl p-4 mb-6 text-left"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
          >
            <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: '#ef4444' }}>
              Rad etish sababi
            </p>
            <p className="text-sm leading-6" style={{ color: 'var(--text-primary)' }}>
              {rejectionReason}
            </p>
          </div>
        )}
        <Link href="/dashboard/apply">
          <button className="btn-primary inline-flex items-center gap-2">
            <Rocket size={15} /> {startupStatus === 'rejected' ? 'Arizani yangilash' : 'Arizani ochish'}
          </button>
        </Link>
      </div>
    </div>
  );
}
