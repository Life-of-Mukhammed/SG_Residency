import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Startup from '@/models/Startup';
import { notifyRoles } from '@/lib/notifications';
import Notification from '@/models/Notification';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || '';
    const region = searchParams.get('region') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const query: Record<string, any> = { deletedAt: null, status: { $ne: 'deleted' } };
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { surname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (region) {
      const startupUsers = await Startup.find({
        region: { $regex: `^${escapeRegex(region)}$`, $options: 'i' },
      }).distinct('userId');
      query._id = { $in: startupUsers };
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('name surname email role status telegramChatId createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    const startupRegions = await Startup.find({
      userId: { $in: users.map((item: any) => item._id) },
    }).select('userId region').lean();

    const regionMap = new Map(
      startupRegions.map((item: any) => [String(item.userId), item.region])
    );

    const usersWithRegion = users.map((item: any) => ({
      ...item,
      region: regionMap.get(String(item._id)) || '',
    }));

    return NextResponse.json({
      users: usersWithRegion,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /api/users]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }
    if (!['user', 'manager', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await connectDB();
    const updated = await User.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      { role },
      { new: true }
    ).select('-password').lean() as any;
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const roleLabel: Record<string, string> = {
      user: 'Founder',
      manager: 'Manager',
      super_admin: 'Super Admin',
    };

    await notifyRoles(['manager', 'super_admin'], {
      title: 'User Role Updated',
      message: `${updated?.name ?? ''} ${updated?.surname ?? ''} (${updated?.email ?? ''}) has been assigned the <b>${roleLabel[role] ?? role}</b> role by super admin.`,
      type: 'info',
      channels: { inApp: true, email: true, telegram: true },
    });
    await AuditLog.create({
      actorId: user.id,
      action: 'user_role_changed',
      entityType: 'User',
      entityId: userId,
      metadata: { role },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('[PATCH /api/users]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const actor = session.user as { id: string; role: string };
    if (actor.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    if (userId === actor.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    await connectDB();

    const target = await User.findById(userId).lean() as any;
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $set: { status: 'deleted', deletedAt: new Date(), deletedBy: actor.id },
      }),
      Startup.updateMany({ userId, deletedAt: null }, {
        $set: { deletedAt: new Date(), deletedBy: actor.id, status: 'inactive' },
      }),
      Notification.updateMany({ managerId: userId }, { $set: { deliveredAt: new Date() } }),
      AuditLog.create({
        actorId: actor.id,
        action: 'user_soft_deleted',
        entityType: 'User',
        entityId: userId,
        metadata: { email: target.email },
      }),
    ]);

    return NextResponse.json({ ok: true, deleted: { id: userId, name: `${target.name} ${target.surname}` } });
  } catch (err) {
    console.error('[DELETE /api/users]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
