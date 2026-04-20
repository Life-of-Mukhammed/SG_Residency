'use client';

import { SessionProvider } from 'next-auth/react';
import { NotificationPoller } from '@/components/NotificationPoller';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationPoller />
      {children}
    </SessionProvider>
  );
}
