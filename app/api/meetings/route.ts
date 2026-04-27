import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';
import { getMeetingEligibleStartup } from '@/lib/access';
import { notifyRoles, notifyUsers } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = session.user as { id: string; role: string };
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';

    const query: Record<string, any> = {};

    if (user.role === 'user') {
      const startup = await getMeetingEligibleStartup(user.id);
      if (!startup) return NextResponse.json({ meetings: [] });
      query.$or = [{ userId: user.id }, { status: 'available' }];
    } else if (user.role === 'manager') {
      query.managerId = user.id;
    }
    if (status) query.status = status;

    const meetings = await Meeting.find(query)
      .populate('managerId', 'name surname email')
      .populate('userId',    'name surname email')
      .populate('startupId', 'startup_name')
      .sort({ scheduledAt: 1 })
      .lean();

    return NextResponse.json({ meetings });
  } catch (err) {
    console.error('[GET /api/meetings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    const body = await req.json();
    await connectDB();

    // USER BOOKING
    if (user.role === 'user') {
      const { date, time, topic, managerId, meetingType, officeAddress } = body;
      if (!date || !time || !topic || !managerId) {
        return NextResponse.json({ error: 'date, time, topic and managerId are required' }, { status: 400 });
      }

      // Build scheduledAt: treat time as Tashkent (UTC+5) → store as UTC
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute]     = time.split(':').map(Number);
      // Tashkent UTC+5
      const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour - 5, minute));

      // Check conflict
      const conflict = await Meeting.findOne({ managerId, scheduledAt, status: 'booked' });
      if (conflict) {
        return NextResponse.json({ error: 'This slot is already taken. Please choose another time.' }, { status: 409 });
      }

      const startup = await getMeetingEligibleStartup(user.id);
      if (!startup) {
        return NextResponse.json({ error: 'Meetings unlock after interview approval or full residency approval.' }, { status: 403 });
      }

      const startupName = (startup as any)?.startup_name || 'Startup meeting';
      let meetLink = meetingType === 'offline'
        ? `Offline meeting - ${officeAddress || 'Office'}`
        : 'https://meet.google.com/eni-ecky-tqm';
      const googleEventId: string | undefined = undefined;
      const meetingMessage = [
        `📌 Topic: ${topic}`,
        `🏢 Startup: ${startupName}`,
        `📅 Date: ${date} at ${time} (Tashkent)`,
        `🔗 Link: ${meetLink}`,
      ].join('\n');

      const meeting = await Meeting.create({
        managerId,
        userId:        user.id,
        startupId:     startup ? (startup as any)._id : undefined,
        title:         startupName,
        topic,
        scheduledAt,
        duration:      30,
        meetLink,
        googleEventId,
        meetingType:   meetingType || 'online',
        officeAddress: meetingType === 'offline' ? officeAddress : undefined,
        status:        'booked',
      });

      await notifyUsers([user.id], {
        title: 'New meeting booked',
        message: meetingMessage,
        type: 'meeting',
        channels: { inApp: true, email: false, telegram: true },
      });
      await notifyRoles(['manager', 'super_admin'], {
        title: 'New meeting booked',
        message: meetingMessage,
        type: 'meeting',
        channels: { inApp: true, email: true, telegram: true },
      });

      const populated = await Meeting.findById(meeting._id)
        .populate('managerId', 'name surname email')
        .populate('userId',    'name surname email')
        .populate('startupId', 'startup_name')
        .lean();

      return NextResponse.json({ meeting: populated }, { status: 201 });
    }

    // MANAGER creates manual slot
    if (['manager','super_admin'].includes(user.role)) {
      if (!body.title || !body.scheduledAt) {
        return NextResponse.json({ error: 'Title and scheduledAt required' }, { status: 400 });
      }
      const meeting = await Meeting.create({
        managerId:   user.id,
        title:       body.title,
        scheduledAt: new Date(body.scheduledAt),
        duration:    body.duration || 30,
        meetLink:    'Google Meet will be created after founder books this slot',
        meetingType: 'online',
        status:      'available',
      });
      return NextResponse.json({ meeting }, { status: 201 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (err) {
    console.error('[POST /api/meetings]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
