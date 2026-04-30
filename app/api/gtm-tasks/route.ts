import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import ResidentGtmTask from '@/models/ResidentGtmTask';
import Startup from '@/models/Startup';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  startupId: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  deadline: z.string().min(1),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number(),
  })).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });

    await connectDB();
    const user = session.user as { id: string; role: string };
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') || '';
    const startupId = searchParams.get('startupId') || '';

    const query: Record<string, any> = {};
    if (user.role === 'user') query.residentId = user.id;
    else if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
    }
    if (status) query.status = status;
    if (startupId) query.startupId = startupId;

    const [total, tasks] = await Promise.all([
      ResidentGtmTask.countDocuments(query),
      ResidentGtmTask.find(query)
        .populate('residentId', 'name surname email')
        .populate('startupId', 'startup_name region')
        .populate('assignedBy', 'name surname')
        .sort({ deadline: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({ tasks, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('[GET /api/gtm-tasks]', err);
    return NextResponse.json({ error: 'Ichki xatolik yuz berdi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
    }

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Noto‘g‘ri maʼlumot' }, { status: 400 });
    }

    await connectDB();
    const startup = await Startup.findOne({ _id: parsed.data.startupId, status: 'active', deletedAt: null }).lean() as any;
    if (!startup) return NextResponse.json({ error: 'Faol rezident topilmadi' }, { status: 404 });

    const task = await ResidentGtmTask.create({
      residentId: startup.userId,
      startupId: startup._id,
      assignedBy: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      deadline: new Date(parsed.data.deadline),
      attachments: parsed.data.attachments,
    });

    await AuditLog.create({
      actorId: user.id,
      action: 'resident_gtm_task_created',
      entityType: 'ResidentGtmTask',
      entityId: task._id,
      metadata: { startupId: String(startup._id), title: task.title },
    });

    const populated = await ResidentGtmTask.findById(task._id)
      .populate('residentId', 'name surname email')
      .populate('startupId', 'startup_name region')
      .populate('assignedBy', 'name surname')
      .lean();

    return NextResponse.json({ task: populated }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/gtm-tasks]', err);
    return NextResponse.json({ error: 'Ichki xatolik yuz berdi' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    const { taskId, status } = await req.json();
    if (!taskId || !['todo', 'in_progress', 'done'].includes(status)) {
      return NextResponse.json({ error: 'Noto‘g‘ri status' }, { status: 400 });
    }

    await connectDB();
    const query: Record<string, any> = { _id: taskId };
    if (user.role === 'user') query.residentId = user.id;
    else if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
    }

    const task = await ResidentGtmTask.findOneAndUpdate(query, { $set: { status } }, { new: true }).lean();
    if (!task) return NextResponse.json({ error: 'Vazifa topilmadi' }, { status: 404 });

    await AuditLog.create({
      actorId: user.id,
      action: 'resident_gtm_task_status_changed',
      entityType: 'ResidentGtmTask',
      entityId: taskId,
      metadata: { status },
    });

    return NextResponse.json({ task });
  } catch (err) {
    console.error('[PATCH /api/gtm-tasks]', err);
    return NextResponse.json({ error: 'Ichki xatolik yuz berdi' }, { status: 500 });
  }
}
