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

// Simple in-memory cache (per server instance) — analytics are aggregate stats so a
// short TTL is acceptable and dramatically reduces DB load.
type CacheEntry = { at: number; data: unknown };
const CACHE_TTL_MS = 60_000;
let cache: CacheEntry | null = null;

const RESIDENT_FILTER = { status: 'active', deletedAt: null } as const;

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return NextResponse.json(cache.data, { headers: { 'X-Cache': 'HIT' } });
    }

    await connectDB();

    const now             = new Date();
    const monthStart      = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd    = new Date(now.getFullYear(), now.getMonth(), 0);
    const sixMonthsAgo    = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // One single aggregation that produces all resident-side analytics
    const facetPipeline = [
      { $match: { deletedAt: null } },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                totalApplications: { $sum: 1 },
                totalResidents:    { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                inactiveResidents: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
                pendingApplications: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                rejectedTotal:     { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                applicationsThisMonth: {
                  $sum: { $cond: [{ $gte: ['$createdAt', monthStart] }, 1, 0] },
                },
                applicationsLastMonth: {
                  $sum: { $cond: [
                    { $and: [
                      { $gte: ['$createdAt', lastMonthStart] },
                      { $lte: ['$createdAt', lastMonthEnd] },
                    ] }, 1, 0,
                  ] },
                },
                rejectedThisMonth: {
                  $sum: { $cond: [
                    { $and: [
                      { $eq: ['$status', 'rejected'] },
                      { $gte: ['$rejectedAt', monthStart] },
                    ] }, 1, 0,
                  ] },
                },
              },
            },
          ],
          residentTotals: [
            { $match: { status: 'active' } },
            {
              $group: {
                _id: null,
                totalMrr:        { $sum: { $ifNull: ['$mrr', 0] } },
                totalUsers:      { $sum: { $ifNull: ['$users_count', 0] } },
                totalInvestment: { $sum: { $ifNull: ['$investment_raised', 0] } },
                totalTeam:       { $sum: { $ifNull: ['$team_size', 0] } },
              },
            },
          ],
          sphereStats: [
            { $match: { status: 'active' } },
            { $group: { _id: '$startup_sphere', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
          ],
          regionStats: [
            { $match: { status: 'active' } },
            { $group: { _id: '$region', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 14 },
          ],
          stageStats: [
            { $match: { status: 'active' } },
            { $group: { _id: '$stage', count: { $sum: 1 } } },
          ],
          leadStatusStats: [
            { $match: { status: 'active', leadStatus: { $nin: [null, ''] } } },
            { $group: { _id: '$leadStatus', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          monthlyResidents: [
            { $match: { status: 'active' } },
            { $addFields: { _resDate: { $ifNull: ['$acceptedAt', '$createdAt'] } } },
            { $match: { _resDate: { $gte: twelveMonthsAgo } } },
            { $group: { _id: { y: { $year: '$_resDate' }, m: { $month: '$_resDate' } }, count: { $sum: 1 } } },
          ],
          monthlyApplications: [
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
          ],
          newResidentsThisMonth: [
            { $match: { status: 'active' } },
            { $addFields: { _resDate: { $ifNull: ['$acceptedAt', '$createdAt'] } } },
            { $match: { _resDate: { $gte: monthStart } } },
            { $count: 'n' },
          ],
          newResidentsLastMonth: [
            { $match: { status: 'active' } },
            { $addFields: { _resDate: { $ifNull: ['$acceptedAt', '$createdAt'] } } },
            { $match: { _resDate: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $count: 'n' },
          ],
          topResidents: [
            { $match: { status: 'active' } },
            { $sort: { mrr: -1, users_count: -1 } },
            { $limit: 5 },
            { $project: {
              startup_name: 1, startup_sphere: 1, region: 1, stage: 1,
              mrr: 1, users_count: 1, investment_raised: 1,
              acceptedAt: 1, leadStatus: 1,
            } },
          ],
        },
      },
    ];

    const [
      [facet] = [{}],
      totalUsers, totalReports, pendingReports, totalMeetings,
      completedTasks, totalTasks,
    ] = await Promise.all([
      Startup.aggregate(facetPipeline as any),
      User.countDocuments({ role: 'user' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Meeting.countDocuments({ status: 'booked' }),
      TaskProgress.countDocuments({ completed: true }),
      TaskProgress.countDocuments(),
    ]);

    const counts = facet.counts?.[0] || {};
    const residentTotals = facet.residentTotals?.[0] || {
      totalMrr: 0, totalUsers: 0, totalInvestment: 0, totalTeam: 0,
    };

    const sphereStats     = facet.sphereStats     || [];
    const regionStats     = facet.regionStats     || [];
    const stageStats      = facet.stageStats      || [];
    const leadStatusAgg   = facet.leadStatusStats || [];
    const topResidents    = facet.topResidents    || [];

    const acceptedThisMonth = facet.newResidentsThisMonth?.[0]?.n ?? 0;
    const acceptedLastMonth = facet.newResidentsLastMonth?.[0]?.n ?? 0;

    // Build month labels and join with aggregated data
    const months12 = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('default', { month: 'short' }) };
    });
    const months6 = months12.slice(-6);

    const residentsMap = Object.fromEntries(
      (facet.monthlyResidents || []).map((r: any) => [`${r._id.y}-${r._id.m - 1}`, r.count])
    );
    const applicationsMap = Object.fromEntries(
      (facet.monthlyApplications || []).map((r: any) => [`${r._id.y}-${r._id.m - 1}`, r.count])
    );

    const monthlyResidents    = months12.map(({ key, label }) => ({ month: label, count: residentsMap[key]    ?? 0 }));
    const monthlyResidents6   = months6.map (({ key, label }) => ({ month: label, count: residentsMap[key]    ?? 0 }));
    const monthlyApplications = months6.map (({ key, label }) => ({ month: label, count: applicationsMap[key] ?? 0 }));

    const bestMonth = monthlyResidents.reduce(
      (acc, m) => (m.count > acc.count ? m : acc),
      { month: '—', count: 0 }
    );

    const topSphere = sphereStats[0]?._id || '—';
    const topRegion = regionStats[0]?._id || '—';
    const topStage  = [...stageStats].sort((a: any, b: any) => b.count - a.count)[0]?._id || '—';
    const leadStatusStats = leadStatusAgg.map((r: any) => ({ status: r._id, count: r.count }));

    const data = {
      // Resident-centric counts
      totalResidents: counts.totalResidents ?? 0,
      inactiveResidents: counts.inactiveResidents ?? 0,
      activeStartups: counts.totalResidents ?? 0,
      acceptedTotal: counts.totalResidents ?? 0,

      // Application counts
      totalApplications: counts.totalApplications ?? 0,
      totalStartups: counts.totalApplications ?? 0,
      pendingStartups: counts.pendingApplications ?? 0,
      pendingApplications: counts.pendingApplications ?? 0,

      // Monthly resident growth
      newResidentsThisMonth: acceptedThisMonth,
      newResidentsLastMonth: acceptedLastMonth,
      acceptedThisMonth,
      acceptedLastMonth,
      newThisMonth: acceptedThisMonth,
      newLastMonth: acceptedLastMonth,

      // Application growth
      applicationsThisMonth: counts.applicationsThisMonth ?? 0,
      applicationsLastMonth: counts.applicationsLastMonth ?? 0,

      // Rejected
      rejectedTotal: counts.rejectedTotal ?? 0,
      rejectedThisMonth: counts.rejectedThisMonth ?? 0,

      // Aggregates
      sphereStats,
      regionStats,
      stageStats,
      leadStatusStats,
      topSphere,
      topRegion,
      topStage,
      bestMonth,
      topResidents,

      // Sums
      residentTotals: {
        totalMrr: residentTotals.totalMrr ?? 0,
        totalUsers: residentTotals.totalUsers ?? 0,
        totalInvestment: residentTotals.totalInvestment ?? 0,
        totalTeam: residentTotals.totalTeam ?? 0,
      },

      // Charts
      monthlyResidents,
      monthlyGrowth: monthlyResidents6,
      monthlyAccepted: monthlyResidents6,
      monthlyApplications,

      // Misc
      totalUsers, totalReports, pendingReports, totalMeetings,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };

    cache = { at: Date.now(), data };

    return NextResponse.json(data, { headers: { 'X-Cache': 'MISS' } });
  } catch (err) {
    console.error('[GET /api/analytics]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
