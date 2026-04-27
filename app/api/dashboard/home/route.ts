import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Startup from '@/models/Startup';
import Report from '@/models/Report';
import Meeting from '@/models/Meeting';
import User from '@/models/User';
import AdSettings from '@/models/AdSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;

    await connectDB();

    // First round: independent queries in parallel
    const [startup, userDoc, adSettings] = await Promise.all([
      Startup.findOne({ userId }).lean(),
      User.findById(userId).select('telegramChatId').lean(),
      AdSettings.findOne().lean(),
    ]);

    const isActive = (startup as any)?.status === 'active';
    const isEligibleForMeetings =
      (startup as any)?.status &&
      ['active', 'lead_accepted'].includes((startup as any).status);

    // Second round: startup-dependent queries in parallel
    const [reports, meetings] = await Promise.all([
      isActive && (startup as any)?._id
        ? Report.find({ startupId: (startup as any)._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name surname email')
            .populate('startupId', 'startup_name')
            .populate('reviewedBy', 'name surname')
            .lean()
        : Promise.resolve([]),
      isEligibleForMeetings
        ? Meeting.find({ $or: [{ userId }, { status: 'available' }] })
            .populate('managerId', 'name surname email')
            .populate('userId', 'name surname email')
            .populate('startupId', 'startup_name')
            .sort({ scheduledAt: 1 })
            .lean()
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      startup: startup ?? null,
      reports,
      meetings,
      telegramChatId: (userDoc as any)?.telegramChatId || null,
      adSettings: adSettings ?? null,
    });
  } catch (err) {
    console.error('[GET /api/dashboard/home]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
