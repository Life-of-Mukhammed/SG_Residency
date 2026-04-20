'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';

export default function DynamicMain({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  const _hydrated   = useAppStore(s => s._hydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Default 240 until hydrated to match server
  const ml = mounted && _hydrated ? (sidebarOpen ? 240 : 64) : 240;

  return (
    <main className="flex-1 min-h-screen" style={{ marginLeft: ml, transition: 'margin-left 0.25s ease' }}>
      {children}
    </main>
  );
}
