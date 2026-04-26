import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Report from '@/models/Report';
import { notifyUsers } from '@/lib/notifications';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status, rejectionReason } = await req.json();

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be accepted or rejected' }, { status: 400 });
    }
    if (status === 'rejected' && !rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    await connectDB();

    const report = await Report.findByIdAndUpdate(
      params.id,
      {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        reviewedBy:      user.id,
        reviewedAt:      new Date(),
      },
      { new: true }
    )
      .populate('userId',    'name surname email')
      .populate('startupId', 'startup_name')
      .lean();

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    const founderId =
      typeof report.userId === 'object' && report.userId && '_id' in report.userId
        ? String(report.userId._id)
        : '';

    if (founderId) {
      await notifyUsers([founderId], {
        title: status === 'accepted' ? 'Weekly report accepted' : 'Weekly report needs updates',
        message:
          status === 'accepted'
            ? `${(report.startupId as any)?.startup_name || 'Your startup'} weekly report has been accepted.`
            : `${(report.startupId as any)?.startup_name || 'Your startup'} weekly report was rejected. ${rejectionReason?.trim() || ''}`.trim(),
        type: 'report',
      });
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error('[PATCH /api/reports/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
