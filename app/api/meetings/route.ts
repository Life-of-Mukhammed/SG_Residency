import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';
import Notification from '@/models/Notification';
import { getActiveStartup } from '@/lib/access';

function genMeetLink(): string {
  const c = 'abcdefghijklmnopqrstuvwxyz';
  const s = (n: number) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
  return `https://meet.google.com/${s(3)}-${s(4)}-${s(3)}`;
}

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
      const startup = await getActiveStartup(user.id);
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
      const { date, time, topic, startupName, managerId, meetingType, officeAddress } = body;
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

      const startup = await getActiveStartup(user.id);
      if (!startup) {
        return NextResponse.json({ error: 'Your startup must be approved before booking meetings.' }, { status: 403 });
      }

      const meeting = await Meeting.create({
        managerId,
        userId:        user.id,
        startupId:     startup ? (startup as any)._id : undefined,
        title:         startupName || (startup as any)?.startup_name || 'Meeting',
        topic,
        scheduledAt,
        duration:      30,
        meetLink:      meetingType === 'offline' ? 'Oflayn - ' + (officeAddress || 'Ofisda') : genMeetLink(),
        meetingType:   meetingType || 'online',
        officeAddress: meetingType === 'offline' ? officeAddress : undefined,
        status:        'booked',
      });

      await Notification.create({
        managerId,
        title: 'Yangi uchrashuv!',
        message: `${startupName || 'Startup'} — ${date} ${time} da uchrashuv belgiladi: "${topic}"`,
        type: 'meeting',
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
        meetLink:    genMeetLink(),
        meetingType: 'online',
        status:      'available',
      });
      return NextResponse.json({ meeting }, { status: 201 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (err) {
    console.error('[POST /api/meetings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
