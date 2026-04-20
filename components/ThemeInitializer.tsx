'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export function ThemeInitializer() {
  const { setTheme, setLang, setSidebarOpen, setHydrated } = useAppStore();

  useEffect(() => {
    // Read from localStorage after mount (client only)
    const theme = (localStorage.getItem('residency_theme') as 'dark' | 'light') || 'dark';
    const lang  = (localStorage.getItem('residency_lang') as any) || 'uz';
    const sidebar = localStorage.getItem('residency_sidebar');

    setTheme(theme);
    setLang(lang);
    if (sidebar !== null) setSidebarOpen(sidebar === 'true');
    setHydrated();

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-lang', lang);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
