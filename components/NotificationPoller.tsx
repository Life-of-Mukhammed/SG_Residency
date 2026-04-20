'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/appStore';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar } from 'lucide-react';

export function NotificationPoller() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const addNotification = useAppStore(s => s.addNotification);

  useEffect(() => {
    if (!['manager', 'super_admin'].includes(role)) return;

    const poll = async () => {
      try {
        const res = await axios.get('/api/notifications');
        const notifs = res.data.notifications ?? [];
        notifs.forEach((n: any) => {
          addNotification({ title: n.title, message: n.message, type: 'meeting' });
          toast.custom(() => (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minWidth: 280 }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Calendar size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                <p className="text-xs mt-0.5"         style={{ color: 'var(--text-muted)'   }}>{n.message}</p>
              </div>
            </div>
          ), { duration: 6000 });
        });
      } catch { /* silent fail */ }
    };

    poll();
    const interval = setInterval(poll, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [role, addNotification]);

  return null;
}
