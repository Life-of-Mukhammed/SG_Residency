'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Rocket, Target, BookOpen, Settings, LogOut, LayoutDashboard,
  Calendar, FileText, Users, BarChart3, Shield, ChevronRight,
  Clock, Menu, X, Sun, Moon, Bell, ChevronDown, Star, TrendingUp
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useState, useEffect } from 'react';

type NavKey = 'dashboard'|'sprint'|'gtm'|'reports'|'meetings'|'books'|'myStartup'|'settings'|
              'managerPanel'|'schedule'|'analytics'|'superAdmin'|'gtmManager'|'sprintManager'|'progressTracker';

const USER_NAV: { key: NavKey; href: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', href: '/dashboard',          icon: <LayoutDashboard size={17}/> },
  { key: 'reports',   href: '/dashboard/reports',  icon: <FileText size={17}/> },
  { key: 'meetings',  href: '/dashboard/meetings', icon: <Calendar size={17}/> },
  { key: 'books',     href: '/dashboard/books',    icon: <BookOpen size={17}/> },
  { key: 'settings',  href: '/dashboard/settings', icon: <Settings size={17}/> },
];

const MGR_NAV: { key: NavKey; href: string; icon: React.ReactNode }[] = [
  { key: 'managerPanel', href: '/manager',           icon: <Users size={17}/>    },
  { key: 'schedule',     href: '/manager/schedule',  icon: <Clock size={17}/>    },
  { key: 'reports',      href: '/manager/reports',   icon: <FileText size={17}/> },
  { key: 'analytics',    href: '/manager/analytics', icon: <BarChart3 size={17}/>},
  { key: 'meetings',     href: '/manager/schedules', icon: <Calendar size={17}/> },
  { key: 'gtmManager',   href: '/manager/gtm',       icon: <Rocket size={17}/>   },
  { key: 'sprintManager',href: '/manager/sprint',    icon: <Target size={17}/>   },
  { key: 'progressTracker',href:'/manager/progress', icon: <TrendingUp size={17}/> },
  { key: 'settings',     href: '/dashboard/settings',icon: <Settings size={17}/> },
];

const ADMIN_NAV: { key: NavKey; href: string; icon: React.ReactNode }[] = [
  { key: 'superAdmin', href: '/super-admin', icon: <Shield size={17}/> },
];

const NAV_LABELS: Record<NavKey, Record<string, string>> = {
  dashboard:     { uz: 'Bosh sahifa',  ru: 'Главная',         en: 'Dashboard'      },
  sprint:        { uz: 'Sprint',       ru: 'Спринт',           en: 'Sprint'         },
  gtm:           { uz: 'GTM',         ru: 'GTM',              en: 'GTM'            },
  reports:       { uz: 'Hisobotlar',  ru: 'Отчёты',           en: 'Reports'        },
  meetings:      { uz: 'Uchrashuvlar',ru: 'Встречи',           en: 'Meetings'       },
  books:         { uz: 'Kitoblar',    ru: 'Книги',             en: 'Books'          },
  myStartup:     { uz: 'Startapim',   ru: 'Мой стартап',      en: 'My Startup'     },
  settings:      { uz: 'Sozlamalar',  ru: 'Настройки',         en: 'Settings'       },
  managerPanel:  { uz: 'Panel',       ru: 'Панель',            en: 'Panel'          },
  schedule:      { uz: 'Jadval',      ru: 'Расписание',        en: 'Schedule'       },
  analytics:     { uz: 'Tahlil',      ru: 'Аналитика',         en: 'Analytics'      },
  superAdmin:    { uz: 'Super Admin', ru: 'Супер Админ',       en: 'Super Admin'    },
  gtmManager:    { uz: 'GTM CRUD',    ru: 'GTM CRUD',          en: 'GTM Manager'    },
  sprintManager: { uz: 'Sprint CRUD', ru: 'Sprint CRUD',       en: 'Sprint Manager' },
  progressTracker:{ uz: 'Progress',    ru: 'Прогресс',           en: 'Progress Tracker'},
};


export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'user';

  const { lang, setLang, theme, toggleTheme, sidebarOpen, toggleSidebar,
          notifications, markAllRead, _hydrated } = useAppStore();

  const [showNotifs, setShowNotifs] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const unread = notifications.filter(n => !n.read).length;

  const label = (key: NavKey) => NAV_LABELS[key]?.[lang] ?? NAV_LABELS[key]?.en ?? key;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Use server-safe defaults until hydrated
  const open = mounted && _hydrated ? sidebarOpen : true;
  const w = open ? 240 : 64;

  const NavLink = ({ item }: { item: { key: NavKey; href: string; icon: React.ReactNode } }) => (
    <Link href={item.href}>
      <div
        className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
        style={{ justifyContent: open ? 'flex-start' : 'center', padding: open ? '10px 12px' : '12px' }}
        title={!open ? label(item.key) : undefined}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {open && <span className="truncate text-sm">{label(item.key)}</span>}
        {open && isActive(item.href) && <ChevronRight size={13} className="ml-auto flex-shrink-0" />}
      </div>
    </Link>
  );

  const Section = ({ title, items }: { title: string; items: typeof MGR_NAV }) => (
    <>
      {open && (
        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</p>
        </div>
      )}
      {!open && <div className="my-2 mx-2 h-px" style={{ background: 'var(--border)' }} />}
      {items.map(item => <NavLink key={item.href} item={item} />)}
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={toggleSidebar} />
      )}

      <aside
        className="fixed left-0 top-0 h-full flex flex-col z-40"
        style={{
          width: w,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          transition: 'width 0.25s ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo + toggle */}
        <div className="flex items-center justify-between px-3 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          {open && (
            <div className="flex items-center gap-2 min-w-0 ml-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Rocket size={14} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>Residency</p>
                <p className="text-xs truncate"            style={{ color: 'var(--text-muted)'   }}>OS</p>
              </div>
            </div>
          )}
          <button onClick={toggleSidebar}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
            {open ? <X size={15}/> : <Menu size={15}/>}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {role === 'user' ? (
            USER_NAV.map(item => <NavLink key={item.href} item={item} />)
          ) : (
            <>
              <Section title="Management" items={MGR_NAV} />
              {role === 'super_admin' && (
                <Section title="Admin" items={ADMIN_NAV} />
              )}
            </>
          )}
        </nav>

        {/* Bottom controls */}
        <div className="border-t px-2 py-3 space-y-1" style={{ borderColor: 'var(--border)' }}>
          {/* Controls row */}
          <div className={`flex items-center gap-1.5 mb-2 ${open ? 'px-1' : 'flex-col'}`}>
            {/* Theme */}
           

            {/* Language */}
            

            {/* Notifications */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center relative"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Bell size={14}/>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white font-bold flex items-center justify-center"
                    style={{ background: '#ef4444', fontSize: 9 }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute bottom-10 left-0 rounded-xl shadow-2xl z-50"
                  style={{ width: 280, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="px-4 py-3 border-b text-sm font-semibold"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    Bildirishnomalar
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        Bildirishnoma yo&apos;q
                      </div>
                    ) : notifications.slice(0, 10).map(n => (
                      <div key={n.id} className="px-4 py-3 border-b"
                        style={{ borderColor: 'var(--border)', background: n.read ? 'transparent' : 'rgba(99,102,241,0.06)' }}>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                        <p className="text-xs mt-0.5"         style={{ color: 'var(--text-muted)'   }}>{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {open && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {session?.user?.name}
                </p>
                <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>
                  {role?.replace('_',' ')}
                </p>
              </div>
            )}
          </div>

          {/* Sign out */}
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-link w-full"
            style={{ justifyContent: open ? 'flex-start' : 'center', padding: open ? '10px 12px' : '12px' }}
            title={!open ? 'Sign Out' : undefined}>
            <LogOut size={15}/>
            {open && <span className="text-sm">{lang === 'uz' ? 'Chiqish' : lang === 'ru' ? 'Выйти' : 'Sign Out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
