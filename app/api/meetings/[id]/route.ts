import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';
import Startup from '@/models/Startup';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    const body = await req.json();

    await connectDB();
    const meeting = await Meeting.findById(params.id);
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    // Manager updates
    if (['manager', 'super_admin'].includes(user.role)) {
      const updated = await Meeting.findByIdAndUpdate(
        params.id, { $set: body }, { new: true }
      ).populate('managerId userId startupId').lean();
      return NextResponse.json({ meeting: updated });
    }

    // User books an available slot
    if (meeting.status !== 'available') {
      return NextResponse.json({ error: 'This slot is no longer available' }, { status: 400 });
    }
    if (!body.topic?.trim()) {
      return NextResponse.json({ error: 'Meeting topic is required' }, { status: 400 });
    }

    const startup = await Startup.findOne({ userId: user.id }).lean();

    const updated = await Meeting.findByIdAndUpdate(
      params.id,
      {
        userId:    user.id,
        startupId: startup ? (startup as { _id: unknown })._id : undefined,
        topic:     body.topic,
        status:    'booked',
      },
      { new: true }
    )
      .populate('managerId', 'name surname email')
      .populate('userId',    'name surname email')
      .populate('startupId', 'startup_name')
      .lean();

    return NextResponse.json({ meeting: updated });
  } catch (err) {
    console.error('[PATCH /api/meetings/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    await Meeting.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[DELETE /api/meetings/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
