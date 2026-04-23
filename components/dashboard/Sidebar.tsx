'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Rocket,
  Target,
  Settings,
  LogOut,
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Shield,
  ChevronRight,
  Clock,
  Menu,
  X,
  Star,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useState, useEffect, MouseEvent } from 'react';
import axios from 'axios';
import { isGtmUnlockedBySprint } from '@/lib/sprint-unlock';

type NavKey =
  | 'dashboard'
  | 'sprint'
  | 'gtm'
  | 'reports'
  | 'meetings'
  | 'myStartup'
  | 'settings'
  | 'managerPanel'
  | 'schedule'
  | 'analytics'
  | 'superAdmin'
  | 'gtmManager'
  | 'sprintManager'
  | 'progressTracker';

const USER_NAV: { key: NavKey; href: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', href: '/dashboard', icon: <LayoutDashboard size={17} /> },
  { key: 'sprint', href: '/dashboard/sprint', icon: <Target size={17} /> },
  { key: 'gtm', href: '/dashboard/gtm', icon: <Rocket size={17} /> },
  { key: 'reports', href: '/dashboard/reports', icon: <FileText size={17} /> },
  { key: 'meetings', href: '/dashboard/meetings', icon: <Calendar size={17} /> },
  { key: 'myStartup', href: '/dashboard/startup', icon: <Star size={17} /> },
  { key: 'settings', href: '/dashboard/settings', icon: <Settings size={17} /> },
];

const MGR_NAV: { key: NavKey; href: string; icon: React.ReactNode }[] = [
  { key: 'managerPanel', href: '/manager', icon: <Users size={17} /> },
  { key: 'schedule', href: '/manager/schedule', icon: <Clock size={17} /> },
  { key: 'reports', href: '/manager/reports', icon: <FileText size={17} /> },
  { key: 'analytics', href: '/manager/analytics', icon: <BarChart3 size={17} /> },
  { key: 'meetings', href: '/manager/schedules', icon: <Calendar size={17} /> },
  { key: 'gtmManager', href: '/manager/gtm', icon: <Rocket size={17} /> },
  { key: 'sprintManager', href: '/manager/sprint', icon: <Target size={17} /> },
  { key: 'progressTracker', href: '/manager/progress', icon: <TrendingUp size={17} /> },
  { key: 'settings', href: '/dashboard/settings', icon: <Settings size={17} /> },
];

const ADMIN_NAV: { key: NavKey; href: string; icon: React.ReactNode }[] = [
  { key: 'superAdmin', href: '/super-admin', icon: <Shield size={17} /> },
];

const NAV_LABELS: Record<NavKey, Record<string, string>> = {
  dashboard: { uz: 'Dashboard', ru: 'Главная', en: 'Dashboard' },
  sprint: { uz: 'Sprint', ru: 'Спринт', en: 'Sprint' },
  gtm: { uz: 'GTM', ru: 'GTM', en: 'GTM' },
  reports: { uz: 'Hisobotlar', ru: 'Отчёты', en: 'Reports' },
  meetings: { uz: 'Uchrashuvlar', ru: 'Встречи', en: 'Meetings' },
  myStartup: { uz: 'Startup', ru: 'Стартап', en: 'Startup' },
  settings: { uz: 'Profil', ru: 'Профиль', en: 'Profile' },
  managerPanel: { uz: 'Panel', ru: 'Панель', en: 'Panel' },
  schedule: { uz: 'Jadval', ru: 'Расписание', en: 'Schedule' },
  analytics: { uz: 'Analitika', ru: 'Аналитика', en: 'Analytics' },
  superAdmin: { uz: 'Super Admin', ru: 'Супер Админ', en: 'Super Admin' },
  gtmManager: { uz: 'GTM CRUD', ru: 'GTM CRUD', en: 'GTM Manager' },
  sprintManager: { uz: 'Sprint CRUD', ru: 'Sprint CRUD', en: 'Sprint Manager' },
  progressTracker: { uz: 'Progress', ru: 'Прогресс', en: 'Progress Tracker' },
};

const APPLY_ALLOWED = new Set(['/dashboard', '/dashboard/apply']);

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'user';
  const { lang, theme, sidebarOpen, toggleSidebar, _hydrated } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [startupStatus, setStartupStatus] = useState<'active' | 'pending' | 'rejected' | 'inactive' | null>(null);
  const [gtmUnlocked, setGtmUnlocked] = useState(false);
  const [showApplyPrompt, setShowApplyPrompt] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (role !== 'user') return;

    const load = async () => {
      try {
        const [startupRes, progressRes, taskRes] = await Promise.all([
          axios.get('/api/startups?limit=1'),
          axios.get('/api/sprints'),
          axios.get('/api/sprint-tasks'),
        ]);
        const startup = startupRes.data.startups?.[0] ?? null;
        setStartupStatus(startup?.status ?? null);
        setGtmUnlocked(
          Boolean(startup?.status === 'active') &&
            isGtmUnlockedBySprint(taskRes.data.tasks ?? [], progressRes.data.tasks ?? [])
        );
      } catch {
        setStartupStatus(null);
        setGtmUnlocked(false);
      }
    };

    load();
  }, [role]);

  const open = mounted && _hydrated ? sidebarOpen : true;
  const w = open ? 254 : 76;
  const userImage = session?.user?.image;

  const label = (key: NavKey) => NAV_LABELS[key]?.[lang] ?? NAV_LABELS[key]?.en ?? key;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const shouldPromptResidency = (item: { key: NavKey; href: string }) => {
    if (role !== 'user') return false;
    if (startupStatus === 'active') return false;
    return !APPLY_ALLOWED.has(item.href);
  };

  const isGtmSoftLocked = (item: { key: NavKey; href: string }) =>
    role === 'user' && item.key === 'gtm' && startupStatus === 'active' && !gtmUnlocked;

  const handleBlockedNav = (event: MouseEvent<HTMLAnchorElement>, item: { key: NavKey; href: string }) => {
    if (shouldPromptResidency(item)) {
      event.preventDefault();
      setShowApplyPrompt(true);
    }
  };

  const NavLink = ({ item }: { item: { key: NavKey; href: string; icon: React.ReactNode } }) => {
    const blocked = shouldPromptResidency(item);
    const gtmLocked = isGtmSoftLocked(item);

    return (
      <Link href={blocked ? pathname || '/dashboard' : item.href} onClick={(event) => handleBlockedNav(event, item)}>
        <div
          className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
          style={{
            justifyContent: open ? 'flex-start' : 'center',
            padding: open ? '11px 13px' : '12px',
            opacity: blocked ? 0.58 : 1,
            background: isActive(item.href) ? 'linear-gradient(135deg, rgba(56,189,248,0.14), rgba(99,102,241,0.16))' : undefined,
          }}
          title={!open ? label(item.key) : undefined}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          {open && <span className="truncate text-sm">{label(item.key)}</span>}
          {open && blocked && <Lock size={12} className="ml-auto flex-shrink-0" />}
          {open && !blocked && gtmLocked && <Lock size={12} className="ml-auto flex-shrink-0" />}
          {open && !blocked && !gtmLocked && isActive(item.href) && <ChevronRight size={13} className="ml-auto flex-shrink-0" />}
        </div>
      </Link>
    );
  };

  const Section = ({ title, items }: { title: string; items: typeof MGR_NAV }) => (
    <>
      {open && (
        <div className="pt-3 pb-1 px-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
        </div>
      )}
      {!open && <div className="my-2 mx-2 h-px" style={{ background: 'var(--border)' }} />}
      {items.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </>
  );

  return (
    <>
      {open && <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={toggleSidebar} />}

      <aside
        className="fixed left-0 top-0 h-full flex flex-col z-40"
        style={{
          width: w,
          background:
            theme === 'light'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,1) 56%, rgba(241,245,249,1) 100%)'
              : 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(17,24,39,0.98) 56%, rgba(11,18,32,1) 100%)',
          borderRight: theme === 'light' ? '1px solid rgba(99,102,241,0.1)' : '1px solid rgba(148,163,184,0.12)',
          transition: 'width 0.25s ease',
          overflow: 'hidden',
        }}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b" style={{ borderColor: 'rgba(148,163,184,0.12)' }}>
          {open ? (
            <div className="flex items-center gap-3 min-w-0 ml-1">
              <img
                src="/sg-logo.png"
                alt="SG Residency"
                className="w-10 h-10 rounded-[18px] object-cover flex-shrink-0 border"
                style={{ borderColor: theme === 'light' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.1)' }}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#f8fafc' }}>
                  <span style={{ color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>SG-Residency</span>
                </p>
                <p className="text-[11px] truncate uppercase tracking-[0.16em]" style={{ color: theme === 'light' ? 'rgba(15,23,42,0.52)' : 'rgba(226,232,240,0.58)' }}>
                  Workspace OS
                </p>
              </div>
            </div>
          ) : (
            <img
              src="/sg-logo.png"
              alt="SG Residency"
              className="w-10 h-10 rounded-[18px] object-cover border"
              style={{ borderColor: theme === 'light' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.1)' }}
            />
          )}

          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: theme === 'light' ? '#334155' : '#cbd5e1', background: theme === 'light' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.06)' }}
          >
            {open ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {role === 'user' ? (
            USER_NAV.map((item) => <NavLink key={item.href} item={item} />)
          ) : (
            <>
              <Section title="Management" items={MGR_NAV} />
              {role === 'super_admin' && <Section title="Admin" items={ADMIN_NAV} />}
            </>
          )}
        </nav>

        <div className="border-t px-2 py-3 space-y-2" style={{ borderColor: theme === 'light' ? 'rgba(99,102,241,0.1)' : 'rgba(148,163,184,0.12)' }}>
          <Link href="/dashboard/settings" className="block">
            <div
              className="flex items-center gap-3 px-2.5 py-2.5 rounded-2xl cursor-pointer"
              style={{ background: theme === 'light' ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.05)', border: `1px solid ${theme === 'light' ? 'rgba(99,102,241,0.1)' : 'rgba(148,163,184,0.08)'}` }}
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt={session?.user?.name || 'User'}
                  className="w-9 h-9 rounded-2xl object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                >
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              {open && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate notranslate" translate="no" style={{ color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                    {session?.user?.name}
                  </p>
                  <p className="text-[11px] truncate capitalize" style={{ color: theme === 'light' ? 'rgba(15,23,42,0.52)' : 'rgba(226,232,240,0.58)' }}>
                    {role?.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-link w-full"
            style={{ justifyContent: open ? 'flex-start' : 'center', padding: open ? '10px 12px' : '12px' }}
            title={!open ? 'Sign Out' : undefined}
          >
            <LogOut size={15} />
            {open && <span className="text-sm">{lang === 'uz' ? 'Chiqish' : lang === 'ru' ? 'Выйти' : 'Sign Out'}</span>}
          </button>
        </div>
      </aside>

      {showApplyPrompt && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.78)', backdropFilter: 'blur(10px)' }}
        >
          <div className="card w-full max-w-md text-center px-7 py-8">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(99,102,241,0.18))' }}
            >
              <Rocket size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Residency application required
            </h3>
            <p className="text-sm mb-6 leading-6" style={{ color: 'var(--text-muted)' }}>
              Dashboard is open now. Sprint, GTM, reports, meetings and the rest of the workspace unlock after your residency request is approved.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowApplyPrompt(false)} className="btn-secondary">
                Later
              </button>
              <Link href="/dashboard/apply" onClick={() => setShowApplyPrompt(false)}>
                <button className="btn-primary">Apply Now</button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
