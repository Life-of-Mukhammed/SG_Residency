import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import TaskProgress from '@/models/TaskProgress';
import Startup from '@/models/Startup';

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

    const result = await Promise.all(
      startups.map(async (s: any) => {
        const tasks = await TaskProgress.find({ startupId: s._id })
          .sort({ updatedAt: -1 })
          .lean();
        const completed = tasks.filter((t: any) => t.completed).length;
        const lastTask  = tasks.find((t: any) => t.completed);
        return {
          startup:     { _id: s._id, startup_name: s.startup_name, stage: s.stage, region: s.region },
          founder:     s.userId,
          totalTasks:  tasks.length,
          completed,
          pct:         tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
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
