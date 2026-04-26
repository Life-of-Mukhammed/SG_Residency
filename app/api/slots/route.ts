import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Schedule from '@/models/Schedule';
import Meeting from '@/models/Meeting';

export const dynamic = 'force-dynamic';
import User from '@/models/User';

const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToTime(m: number): string {
  return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateStr   = searchParams.get('date');
    const managerId = searchParams.get('managerId');

    if (!dateStr) return NextResponse.json({ error: 'date is required' }, { status: 400 });

    await connectDB();

    // Find manager
    let resolvedId = managerId;
    if (!resolvedId) {
      const mgr = await User.findOne({ role: { $in: ['manager','super_admin'] } }).lean();
      resolvedId = mgr ? (mgr as any)._id.toString() : null;
    }
    if (!resolvedId) return NextResponse.json({ slots: [], managerId: null });

    // Load schedule
    const schedule = await Schedule.findOne({ managerId: resolvedId }).lean() as any;
    const slotDuration = schedule?.slotDuration ?? 30;

    // Day of week
    const date   = new Date(dateStr + 'T12:00:00');
    const dayKey = DAY_KEYS[date.getDay()];
    const daySchedule = schedule?.[dayKey];

    if (!daySchedule?.enabled || !daySchedule.slots?.length) {
      return NextResponse.json({ slots: [], managerId: resolvedId, slotDuration });
    }

    // Generate all possible slots
    const allSlots: string[] = [];
    for (const range of daySchedule.slots) {
      let cur = timeToMin(range.start);
      const end = timeToMin(range.end);
      while (cur + slotDuration <= end) {
        allSlots.push(minToTime(cur));
        cur += slotDuration;
      }
    }

    // Load booked meetings for this date
    const dayStart = new Date(dateStr + 'T00:00:00.000Z');
    const dayEnd   = new Date(dateStr + 'T23:59:59.999Z');

    const booked = await Meeting.find({
      managerId: resolvedId,
      scheduledAt: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['booked'] },
    }).lean();

    const bookedSet = new Set(
      booked.map((m: any) => {
        const d = new Date(m.scheduledAt);
        // Convert UTC to Tashkent (UTC+5)
        const tashkentMs = d.getTime() + 5 * 60 * 60 * 1000;
        const td = new Date(tashkentMs);
        return `${String(td.getUTCHours()).padStart(2,'0')}:${String(td.getUTCMinutes()).padStart(2,'0')}`;
      })
    );

    // Filter out past + booked
    const now = new Date();
    const tashkentNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const todayStr = `${tashkentNow.getUTCFullYear()}-${String(tashkentNow.getUTCMonth()+1).padStart(2,'0')}-${String(tashkentNow.getUTCDate()).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const currentMin = isToday ? tashkentNow.getUTCHours() * 60 + tashkentNow.getUTCMinutes() + 30 : 0;

    const available = allSlots.filter(slot => {
      if (bookedSet.has(slot)) return false;
      if (isToday && timeToMin(slot) <= currentMin) return false;
      return true;
    });

    return NextResponse.json({ slots: available, managerId: resolvedId, slotDuration });
  } catch (err) {
    console.error('[GET /api/slots]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
