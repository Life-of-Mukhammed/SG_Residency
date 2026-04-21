import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import TaskProgress from '@/models/TaskProgress';
import mongoose from 'mongoose';
import { getActiveStartup } from '@/lib/access';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user    = session.user as { id: string; role: string };
    const startup = await getActiveStartup(user.id);
    if (!startup)  return NextResponse.json({ tasks: [] });

    const startupId = (startup as any)._id as mongoose.Types.ObjectId;
    const tasks = await TaskProgress.find({ startupId }).lean();
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('[GET /api/sprints]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    const { taskId, quarter, month, completed, comment } = await req.json();

    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    if (completed && !comment?.trim()) {
      return NextResponse.json({ error: 'comment_required' }, { status: 400 });
    }

    await connectDB();

    const startup = await getActiveStartup(user.id);
    if (!startup) {
      return NextResponse.json({ error: 'Your startup must be approved before using sprint.' }, { status: 403 });
    }

    const startupId = (startup as any)._id as mongoose.Types.ObjectId;

    const task = await TaskProgress.findOneAndUpdate(
      { userId: user.id, startupId, taskId },
      {
        userId:      user.id,
        startupId,
        taskId,
        quarter,
        month,
        completed,
        comment:     comment || '',
        completedAt: completed ? new Date() : undefined,
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ task });
  } catch (err) {
    console.error('[POST /api/sprints]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
