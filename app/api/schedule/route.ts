import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Schedule from '@/models/Schedule';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get('managerId');
    const user = session.user as { id: string; role: string };

    await connectDB();

    const id = managerId || user.id;
    let schedule = await Schedule.findOne({ managerId: id }).lean();

    if (!schedule) {
      // Return default schedule
      schedule = {
        managerId: id,
        timezone: 'Asia/Tashkent',
        monday:    { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
        tuesday:   { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
        thursday:  { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
        friday:    { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
        saturday:  { enabled: false, slots: [] },
        sunday:    { enabled: false, slots: [] },
        slotDuration: 30,
      } as any;
    }

    return NextResponse.json({ schedule });
  } catch (err) {
    console.error('[GET /api/schedule]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();

    const schedule = await Schedule.findOneAndUpdate(
      { managerId: user.id },
      { $set: { ...body, managerId: user.id } },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ schedule });
  } catch (err) {
    console.error('[PUT /api/schedule]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
