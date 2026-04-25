import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Startup from '@/models/Startup';
import { notifyUsers } from '@/lib/notifications';
import { z } from 'zod';

const startupUpdateSchema = z.object({
  status: z.enum(['pending', 'active', 'inactive', 'rejected']).optional(),
  managerId: z.string().optional(),
  rejectionReason: z.string().trim().max(500).optional(),
}).strict();

const startupOwnerUpdateSchema = z.object({
  startup_name: z.string().min(1).optional(),
  pitch_deck: z.string().optional(),
  mrr: z.coerce.number().min(0).optional(),
  users_count: z.coerce.number().min(0).optional(),
  investment_raised: z.coerce.number().min(0).optional(),
  team_size: z.coerce.number().min(1).optional(),
}).strict();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    await connectDB();
    const startup = await Startup.findById(params.id)
      .populate('userId',    'name surname email')
      .populate('managerId', 'name surname email')
      .lean();

    if (!startup) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const ownerId =
      typeof startup.userId === 'object' && startup.userId && '_id' in startup.userId
        ? String(startup.userId._id)
        : String(startup.userId);
    if (user.role === 'user' && ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ startup });
  } catch (err) {
    console.error('[GET /api/startups/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    const body = await req.json();
    await connectDB();

    const current = await Startup.findById(params.id).lean();
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (user.role === 'user') {
      if (String(current.userId) !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const parsed = startupOwnerUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
      }

      const startup = await Startup.findByIdAndUpdate(
        params.id,
        { $set: parsed.data },
        { new: true }
      ).populate('userId', 'name surname email').lean();

      return NextResponse.json({ startup });
    }

    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = startupUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    if (parsed.data.status === 'rejected' && !parsed.data.rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const patch: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'active' && !current.managerId) {
      patch.managerId = user.id;
    }
    if (parsed.data.status === 'active') {
      patch.rejectionReason = '';
    }
    if (parsed.data.status === 'pending') {
      patch.rejectionReason = '';
    }

    const startup = await Startup.findByIdAndUpdate(
      params.id,
      { $set: patch },
      { new: true }
    ).populate('userId', 'name surname email').lean();

    if (!startup) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (typeof parsed.data.status === 'string' && parsed.data.status !== current.status) {
      const userId = typeof startup.userId === 'object' && startup.userId && '_id' in startup.userId
        ? String(startup.userId._id)
        : String(current.userId);

      const title =
        parsed.data.status === 'active'
          ? 'Application approved'
          : parsed.data.status === 'rejected'
            ? 'Application rejected'
            : 'Application status updated';

      const message =
        parsed.data.status === 'active'
          ? `${startup.startup_name} has been approved. Reports, meetings, sprint, and GTM are now open for you.`
          : parsed.data.status === 'rejected'
            ? `${startup.startup_name} was rejected. Reason: ${parsed.data.rejectionReason?.trim() || 'No reason provided.'}`
            : `${startup.startup_name} status changed to ${parsed.data.status}.`;

      await notifyUsers([userId], { title, message, type: 'info' });
    }

    return NextResponse.json({ startup });
  } catch (err) {
    console.error('[PATCH /api/startups/[id]]', err);
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
    await Startup.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[DELETE /api/startups/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
