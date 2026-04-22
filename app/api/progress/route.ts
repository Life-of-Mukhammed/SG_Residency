import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import TaskProgress from '@/models/TaskProgress';
import Startup from '@/models/Startup';
import SprintTask from '@/models/SprintTask';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Get all startups with their progress
    const startups = await Startup.find({ status: 'active' })
      .populate('userId', 'name surname email')
      .lean();

    const allSprintTasks = await SprintTask.find({}).select('_id quarter month title').lean();
    const totalAvailableTasks = allSprintTasks.length;

    const result = await Promise.all(
      startups.map(async (s: any) => {
        const tasks = await TaskProgress.find({ startupId: s._id })
          .populate('reviewedBy', 'name surname')
          .sort({ updatedAt: -1 })
          .lean();
        const completed = tasks.filter((t: any) => t.completed).length;
        const lastTask  = tasks.find((t: any) => t.completed);
        const completionPct = totalAvailableTasks > 0 ? Math.round((completed / totalAvailableTasks) * 100) : 0;
        return {
          startup:     { _id: s._id, startup_name: s.startup_name, stage: s.stage, region: s.region },
          founder:     s.userId,
          totalTasks:  totalAvailableTasks,
          completed,
          pct:         completionPct,
          lastActivity: lastTask ? { taskId: lastTask.taskId, comment: (lastTask as any).comment, completedAt: lastTask.completedAt } : null,
          recentTasks: tasks.slice(0, 5),
        };
      })
    );

    return NextResponse.json({ progress: result });
  } catch (err) {
    console.error('[GET /api/progress]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { taskProgressId, reviewed } = await req.json();
    if (!taskProgressId || typeof reviewed !== 'boolean') {
      return NextResponse.json({ error: 'taskProgressId and reviewed are required' }, { status: 400 });
    }

    await connectDB();

    const task = await TaskProgress.findByIdAndUpdate(
      taskProgressId,
      {
        reviewed,
        reviewedBy: reviewed ? user.id : undefined,
        reviewedAt: reviewed ? new Date() : undefined,
      },
      { new: true }
    )
      .populate('reviewedBy', 'name surname')
      .lean();

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ task });
  } catch (err) {
    console.error('[PATCH /api/progress]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
