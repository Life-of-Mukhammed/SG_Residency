import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Startup from '@/models/Startup';
import Report from '@/models/Report';
import Meeting from '@/models/Meeting';
import User from '@/models/User';
import TaskProgress from '@/models/TaskProgress';

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

    const now            = new Date();
    const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalStartups, activeStartups, inactiveStartups, pendingStartups,
      newThisMonth, newLastMonth, totalUsers, totalReports, pendingReports,
      totalMeetings, sphereStats, stageStats, completedTasks, totalTasks,
      acceptedThisMonth, acceptedTotal,
    ] = await Promise.all([
      Startup.countDocuments(),
      Startup.countDocuments({ status: 'active' }),
      Startup.countDocuments({ status: 'inactive' }),
      Startup.countDocuments({ status: 'pending' }),
      Startup.countDocuments({ createdAt: { $gte: monthStart } }),
      Startup.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      User.countDocuments({ role: 'user' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Meeting.countDocuments({ status: 'booked' }),
      Startup.aggregate([
        { $group: { _id: '$startup_sphere', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Startup.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
      TaskProgress.countDocuments({ completed: true }),
      TaskProgress.countDocuments(),
      Startup.countDocuments({ status: 'active', acceptedAt: { $gte: monthStart } }),
      Startup.countDocuments({ status: 'active' }),
    ]);

    // Monthly growth — last 6 months
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await Startup.countDocuments({ createdAt: { $gte: start, $lte: end } });
      monthlyGrowth.push({
        month: start.toLocaleString('default', { month: 'short' }),
        count,
      });
    }

    // Monthly accepted residents — last 6 months
    const monthlyAccepted = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await Startup.countDocuments({ status: 'active', acceptedAt: { $gte: start, $lte: end } });
      monthlyAccepted.push({
        month: start.toLocaleString('default', { month: 'short' }),
        count,
      });
    }

    return NextResponse.json({
      totalStartups, activeStartups, inactiveStartups, pendingStartups,
      newThisMonth, newLastMonth, totalUsers, totalReports, pendingReports,
      totalMeetings, sphereStats, stageStats, monthlyGrowth, monthlyAccepted,
      acceptedThisMonth, acceptedTotal,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    });
  } catch (err) {
    console.error('[GET /api/analytics]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
