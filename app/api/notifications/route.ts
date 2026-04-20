import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ notifications: [] });

    const user = session.user as { id: string; role: string };
    await connectDB();

    const notifications = await Notification.find({
      managerId: user.id,
      deliveredAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (notifications.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notifications.map((notification) => notification._id) } },
        { $set: { deliveredAt: new Date() } }
      );
    }

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error('[GET /api/notifications]', err);
    return NextResponse.json({ notifications: [] });
  }
}
