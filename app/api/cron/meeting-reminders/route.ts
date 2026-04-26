import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';
import { notifyRoles, notifyUsers } from '@/lib/notifications';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const windowStart = new Date(now.getTime() + 9 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 11 * 60 * 1000);

    const meetings = await Meeting.find({
      status: 'booked',
      reminderSentAt: null,
      scheduledAt: { $gte: windowStart, $lte: windowEnd },
    })
      .populate('userId', 'name surname email')
      .populate('managerId', 'name surname email')
      .lean();

    for (const meeting of meetings) {
      const recipients = [String(meeting.managerId), String(meeting.userId)].filter(Boolean);
      const populatedManager = meeting.managerId as { name?: string; surname?: string } | null;
      const populatedFounder = meeting.userId as { name?: string; surname?: string } | null;
      const managerName =
        populatedManager?.name
          ? `${populatedManager.name} ${populatedManager.surname || ''}`.trim()
          : 'manager';
      const founderName =
        populatedFounder?.name
          ? `${populatedFounder.name} ${populatedFounder.surname || ''}`.trim()
          : 'founder';
      const message = [
        `📌 Topic: ${meeting.topic || meeting.title}`,
        `👤 Founder: ${founderName}`,
        `🛠 Manager: ${managerName}`,
        `🔗 Link: ${meeting.meetLink}`,
      ].join('\n');

      await notifyUsers(recipients, {
        title: '⏰ Meeting starts in 10 minutes!',
        message,
        type: 'meeting',
        channels: { inApp: true, email: false, telegram: true },
      });
      await notifyRoles(['manager', 'super_admin'], {
        title: '⏰ Meeting starts in 10 minutes!',
        message,
        type: 'meeting',
        channels: { inApp: true, email: true, telegram: true },
      });
    }

    if (meetings.length > 0) {
      await Meeting.updateMany(
        { _id: { $in: meetings.map((meeting) => meeting._id) } },
        { $set: { reminderSentAt: new Date() } }
      );
    }

    return NextResponse.json({ ok: true, remindersSent: meetings.length });
  } catch (error) {
    console.error('[GET /api/cron/meeting-reminders]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
