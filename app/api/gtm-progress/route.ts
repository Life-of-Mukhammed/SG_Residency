import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import GtmItem from '@/models/GtmItem';
import GtmTaskProgress from '@/models/GtmTaskProgress';
import Startup from '@/models/Startup';
import { getUserStartup } from '@/lib/access';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });

    await connectDB();

    const user = session.user as { id: string; role: string };
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === '1';

    if (all) {
      if (!['manager', 'super_admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
      }

      const [items, startups] = await Promise.all([
        GtmItem.find({}).select('_id title section category').lean(),
        Startup.find({ status: 'active', deletedAt: null })
          .select('startup_name region stage userId')
          .populate('userId', 'name surname email')
          .lean(),
      ]);

      const totalTasks = items.length;
      const startupIds = startups.map((startup: any) => startup._id);
      const allProgress = await GtmTaskProgress.find({ startupId: { $in: startupIds } })
        .populate('gtmItemId', 'title section category')
        .populate('reviewedBy', 'name surname')
        .sort({ updatedAt: -1 })
        .lean();

      const progressByStartup = new Map<string, any[]>();
      for (const task of allProgress) {
        const key = String((task as any).startupId);
        progressByStartup.set(key, [...(progressByStartup.get(key) ?? []), task]);
      }

      const result = startups.map((startup: any) => {
        const tasks = progressByStartup.get(String(startup._id)) ?? [];
        const completed = tasks.filter((task: any) => task.completed).length;
        return {
          startup: {
            _id: startup._id,
            startup_name: startup.startup_name,
            region: startup.region,
            stage: startup.stage,
          },
          founder: startup.userId,
          totalTasks,
          completed,
          pct: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
          recentTasks: tasks.slice(0, 8),
        };
      });

      return NextResponse.json({ progress: result });
    }

    const startup = await getUserStartup(user.id);
    if (!startup) return NextResponse.json({ tasks: [] });

    const startupId = (startup as any)._id as mongoose.Types.ObjectId;
    const tasks = await GtmTaskProgress.find({ startupId }).lean();
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('[GET /api/gtm-progress]', err);
    return NextResponse.json({ error: 'Ichki xatolik yuz berdi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });

    const user = session.user as { id: string };
    const { gtmItemId, completed, comment } = await req.json();

    if (!gtmItemId) return NextResponse.json({ error: 'GTM vazifasi tanlanmagan' }, { status: 400 });
    if (completed && !comment?.trim()) {
      return NextResponse.json({ error: 'comment_required' }, { status: 400 });
    }

    await connectDB();

    const startup = await getUserStartup(user.id);
    if (!startup) {
      return NextResponse.json({ error: 'Avval rezidentlik arizasini yuboring' }, { status: 403 });
    }

    const item = await GtmItem.findById(gtmItemId).select('_id').lean();
    if (!item) return NextResponse.json({ error: 'GTM vazifasi topilmadi' }, { status: 404 });

    const startupId = (startup as any)._id as mongoose.Types.ObjectId;
    const existing = await GtmTaskProgress.findOne({ userId: user.id, startupId, gtmItemId }).lean();
    if (existing?.completed) {
      return NextResponse.json({ error: 'task_locked' }, { status: 409 });
    }

    const task = await GtmTaskProgress.findOneAndUpdate(
      { userId: user.id, startupId, gtmItemId },
      {
        userId: user.id,
        startupId,
        gtmItemId,
        completed: Boolean(completed),
        comment: comment || '',
        completedAt: completed ? new Date() : undefined,
        reviewed: false,
        reviewedBy: undefined,
        reviewedAt: undefined,
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ task });
  } catch (err) {
    console.error('[POST /api/gtm-progress]', err);
    return NextResponse.json({ error: 'Ichki xatolik yuz berdi' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
    }

    const { progressId, reviewed } = await req.json();
    if (!progressId || typeof reviewed !== 'boolean') {
      return NextResponse.json({ error: 'Maʼlumot yetarli emas' }, { status: 400 });
    }

    await connectDB();

    const task = await GtmTaskProgress.findByIdAndUpdate(
      progressId,
      {
        reviewed,
        reviewedBy: reviewed ? user.id : undefined,
        reviewedAt: reviewed ? new Date() : undefined,
      },
      { new: true }
    )
      .populate('gtmItemId', 'title section category')
      .populate('reviewedBy', 'name surname')
      .lean();

    if (!task) return NextResponse.json({ error: 'Natija topilmadi' }, { status: 404 });

    return NextResponse.json({ task });
  } catch (err) {
    console.error('[PATCH /api/gtm-progress]', err);
    return NextResponse.json({ error: 'Ichki xatolik yuz berdi' }, { status: 500 });
  }
}
