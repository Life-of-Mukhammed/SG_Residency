import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';
import { notifyRoles, notifyUsers } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function extractId(field: unknown): string | null {
  if (!field) return null;
  if (typeof field === 'object' && field !== null && '_id' in field) {
    return String((field as { _id: unknown })._id);
  }
  return String(field);
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const windowStart = new Date(now.getTime() + 9 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 11 * 60 * 1000);

    const meetings = await Meeting.find({
      status: 'booked',
      reminderSentAt: null,
      scheduledAt: { $gte: windowStart, $lte: windowEnd },
    })
      .populate('userId',    'name surname email telegramChatId')
      .populate('managerId', 'name surname email telegramChatId')
      .lean();

    for (const meeting of meetings) {
      const founderId  = extractId(meeting.userId);
      const populatedFounder  = meeting.userId  as any;
      const populatedManager  = meeting.managerId as any;

      const founderName = populatedFounder?.name
        ? `${populatedFounder.name} ${populatedFounder.surname || ''}`.trim()
        : 'Founder';
      const managerName = populatedManager?.name
        ? `${populatedManager.name} ${populatedManager.surname || ''}`.trim()
        : 'Manager';

      const dateStr = new Date(meeting.scheduledAt).toLocaleString('en-GB', {
        timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      const message = [
        `📌 Topic: ${meeting.topic || meeting.title}`,
        `📅 Time: ${dateStr} (Tashkent)`,
        `👤 Founder: ${founderName}`,
        `🛠 Manager: ${managerName}`,
        `🔗 Link: ${meeting.meetLink}`,
      ].join('\n');

      // Notify founder
      if (founderId) {
        await notifyUsers([founderId], {
          title: '⏰ Meeting in 10 minutes!',
          message,
          type: 'meeting',
          channels: { inApp: true, email: true, telegram: true },
        });
      }

      // Notify all managers and super admins
      await notifyRoles(['manager', 'super_admin'], {
        title: '⏰ Meeting in 10 minutes!',
        message,
        type: 'meeting',
        channels: { inApp: true, email: true, telegram: true },
      });
    }

    if (meetings.length > 0) {
      await Meeting.updateMany(
        { _id: { $in: meetings.map((m) => m._id) } },
        { $set: { reminderSentAt: new Date() } }
      );
    }

    return NextResponse.json({ ok: true, remindersSent: meetings.length });
  } catch (error) {
    console.error('[GET /api/cron/meeting-reminders]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
