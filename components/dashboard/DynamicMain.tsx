'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';

export default function DynamicMain({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  const _hydrated   = useAppStore(s => s._hydrated);
  const [mounted, setMounted]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // On mobile (<640px): sidebar overlays, so no margin needed
  const ml = isMobile ? 0 : (mounted && _hydrated ? (sidebarOpen ? 254 : 76) : 254);

  return (
    <main
      className="flex-1 min-h-screen"
      style={{ marginLeft: ml, transition: 'margin-left 0.25s ease' }}
    >
      {children}
    </main>
  );
}
