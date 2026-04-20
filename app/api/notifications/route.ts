import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { pendingNotifications } from '@/lib/notificationQueue';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ notifications: [] });

    const user = session.user as { id: string; role: string };

    // Pull notifications for this manager
    const mine: typeof pendingNotifications = [];
    const rest: typeof pendingNotifications = [];

    pendingNotifications.forEach(n => {
      if (n.managerId === user.id) mine.push(n);
      else rest.push(n);
    });

    // Clear delivered ones
    pendingNotifications.length = 0;
    pendingNotifications.push(...rest);

    return NextResponse.json({ notifications: mine });
  } catch (err) {
    console.error('[GET /api/notifications]', err);
    return NextResponse.json({ notifications: [] });
  }
}
