import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Meeting from '@/models/Meeting';
import Startup from '@/models/Startup';
import User from '@/models/User';
import { createGoogleMeetEvent, deleteGoogleMeetEvent } from '@/lib/google-calendar';
import { notifyRoles, notifyUsers } from '@/lib/notifications';

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

      if (meeting.userId) {
        const dateStr = new Date(body.scheduledAt || meeting.scheduledAt).toLocaleString('en-GB', {
          timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
          day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        await notifyUsers([String(meeting.userId)], {
          title: 'Meeting updated',
          message: `Your meeting "${meeting.topic || meeting.title}" has been updated.\n📅 Date: ${dateStr} (Tashkent)`,
          type: 'meeting',
          channels: { inApp: true, email: true, telegram: true },
        });
      }

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
    const manager = await User.findById(meeting.managerId).select('email').lean();

    const conference = await createGoogleMeetEvent({
      title: `${meeting.title} Meeting`,
      topic: body.topic,
      scheduledAt: new Date(meeting.scheduledAt),
      duration: meeting.duration || 30,
      founderEmail: session.user?.email || undefined,
      managerEmail: (manager as any)?.email,
    });

    const updated = await Meeting.findByIdAndUpdate(
      params.id,
      {
        userId:    user.id,
        startupId: startup ? (startup as { _id: unknown })._id : undefined,
        topic:     body.topic,
        meetLink:  conference.meetLink,
        googleEventId: conference.eventId,
        status:    'booked',
      },
      { new: true }
    )
      .populate('managerId', 'name surname email')
      .populate('userId',    'name surname email')
      .populate('startupId', 'startup_name')
      .lean();
    const reminderMessage = `${meeting.title} with ${(updated as any)?.userId?.name || 'founder'} is confirmed for ${new Date(meeting.scheduledAt).toLocaleString('en-GB', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}. Link: ${conference.meetLink}`;

    await notifyUsers([user.id], {
      title: 'Meeting confirmed',
      message: reminderMessage,
      type: 'meeting',
      channels: { inApp: true, email: false, telegram: true },
    });
    await notifyRoles(['manager', 'super_admin'], {
      title: 'Meeting confirmed',
      message: reminderMessage,
      type: 'meeting',
      channels: { inApp: true, email: true, telegram: true },
    });

    return NextResponse.json({ meeting: updated });
  } catch (err) {
    console.error('[PATCH /api/meetings/[id]]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    await connectDB();
    const meeting = await Meeting.findById(params.id);
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    if (['manager', 'super_admin'].includes(user.role)) {
      if (meeting.googleEventId) {
        try {
          await deleteGoogleMeetEvent(meeting.googleEventId);
        } catch (error) {
          console.error('[DELETE /api/meetings/[id]] google delete failed', error);
        }
      }
      if (meeting.userId) {
        const cancelDateStr = new Date(meeting.scheduledAt).toLocaleString('en-GB', {
          timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
          day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        await notifyUsers([String(meeting.userId)], {
          title: 'Meeting cancelled',
          message: `Your meeting "${meeting.topic || meeting.title}" scheduled for ${cancelDateStr} (Tashkent) has been cancelled.`,
          type: 'meeting',
          channels: { inApp: true, email: true, telegram: true },
        });
      }
      await notifyRoles(['manager', 'super_admin'], {
        title: 'Meeting cancelled',
        message: `${meeting.title} meeting has been cancelled.`,
        type: 'meeting',
        channels: { inApp: true, email: true, telegram: true },
      });
      await Meeting.findByIdAndDelete(params.id);
      return NextResponse.json({ message: 'Deleted' });
    }

    if (user.role === 'user' && String(meeting.userId) === user.id && meeting.status === 'booked') {
      if (meeting.googleEventId) {
        try {
          await deleteGoogleMeetEvent(meeting.googleEventId);
        } catch (error) {
          console.error('[DELETE /api/meetings/[id]] google delete failed', error);
        }
      }
      await notifyRoles(['manager', 'super_admin'], {
        title: 'Meeting cancelled',
        message: `${meeting.title} meeting has been cancelled by the founder.`,
        type: 'meeting',
        channels: { inApp: true, email: true, telegram: true },
      });
      await Meeting.findByIdAndDelete(params.id);
      return NextResponse.json({ message: 'Cancelled' });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (err) {
    console.error('[DELETE /api/meetings/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
