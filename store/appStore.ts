import { create } from 'zustand';
import { translations, Lang, TranslationKey } from '@/lib/i18n/translations';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'meeting' | 'report' | 'info';
  read: boolean;
  createdAt: string;
}

interface AppStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAllRead: () => void;
  unreadCount: () => number;
  _hydrated: boolean;
  setHydrated: () => void;
}

export const useAppStore = create<AppStore>()((set, get) => ({
  lang: 'uz',
  setLang: (lang) => {
    set({ lang });
    if (typeof localStorage !== 'undefined') localStorage.setItem('residency_lang', lang);
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-lang', lang);
  },
  t: (key) => {
    const { lang } = get();
    return translations[lang]?.[key] ?? translations.en[key] ?? String(key);
  },

  theme: 'dark',
  setTheme: (theme) => {
    set({ theme });
    if (typeof localStorage !== 'undefined') localStorage.setItem('residency_theme', theme);
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme);
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  sidebarOpen: true,
  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
    if (typeof localStorage !== 'undefined') localStorage.setItem('residency_sidebar', String(open));
  },
  toggleSidebar: () => get().setSidebarOpen(!get().sidebarOpen),

  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: Date.now().toString(), read: false, createdAt: new Date().toISOString() },
        ...s.notifications.slice(0, 49),
      ],
    })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  _hydrated: false,
  setHydrated: () => set({ _hydrated: true }),
}));
