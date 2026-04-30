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

// AdSettings rarely change — cache in memory for a minute to avoid hitting Mongo on every dashboard hit.
let adCache: { at: number; data: unknown } | null = null;
const AD_TTL_MS = 60_000;

const STARTUP_FIELDS = '_id startup_name startup_sphere region status stage mrr users_count rejectionReason acceptedAt';
const REPORT_FIELDS  = '_id status weekStart createdAt';
const MEETING_FIELDS = '_id title topic status scheduledAt meetLink meetingType officeAddress duration managerId userId';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;

    await connectDB();

    const adPromise = (adCache && Date.now() - adCache.at < AD_TTL_MS)
      ? Promise.resolve(adCache.data)
      : AdSettings.findOne().lean().then((doc) => {
          adCache = { at: Date.now(), data: doc };
          return doc;
        });

    const [startup, userDoc, adSettings] = await Promise.all([
      Startup.findOne({ userId, deletedAt: null }).select(STARTUP_FIELDS).lean(),
      User.findById(userId).select('telegramChatId').lean(),
      adPromise,
    ]);

    const status = (startup as any)?.status;
    const isActive = status === 'active';
    const isEligibleForMeetings = status === 'active' || status === 'lead_accepted';

    const fromNow = new Date();
    const [reports, meetings] = await Promise.all([
      isActive && (startup as any)?._id
        ? Report.find({ startupId: (startup as any)._id })
            .select(REPORT_FIELDS)
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
      isEligibleForMeetings
        ? Meeting.find({
            $or: [
              { userId },
              { status: 'available', scheduledAt: { $gte: fromNow } },
            ],
          })
            .select(MEETING_FIELDS)
            .sort({ scheduledAt: 1 })
            .limit(50)
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
