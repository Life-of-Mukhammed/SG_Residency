import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Report from '@/models/Report';
import Startup from '@/models/Startup';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user   = session.user as { id: string; role: string };
    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get('page')  || '1');
    const limit  = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';

    const query: Record<string, any> = {};

    if (user.role === 'user') {
      const startup = await Startup.findOne({ userId: user.id }).select('_id').lean();
      if (!startup) {
        return NextResponse.json({
          reports: [],
          pagination: { total: 0, page, limit, pages: 0 },
        });
      }
      query.startupId = startup._id;
    }
    if (status) query.status = status;

    const total   = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('userId',     'name surname email')
      .populate('startupId',  'startup_name')
      .populate('reviewedBy', 'name surname')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      reports,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /api/reports]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    const body = await req.json();

    if (!body.completed?.trim() || !body.notCompleted?.trim() || !body.plans?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await connectDB();

    const startup = await Startup.findOne({ userId: user.id }).select('_id').lean();
    if (!startup) {
      return NextResponse.json(
        { error: 'No startup found. Please submit an application first.' },
        { status: 404 }
      );
    }

    const startupId = startup._id as mongoose.Types.ObjectId;

    // Current week bounds (Mon–Sun)
    const now       = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const existing = await Report.findOne({
      startupId,
      weekStart: { $gte: weekStart },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Report already submitted for this week' },
        { status: 400 }
      );
    }

    const report = await Report.create({
      userId:       user.id,
      startupId,
      weekStart,
      weekEnd,
      completed:    body.completed,
      notCompleted: body.notCompleted,
      plans:        body.plans,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/reports]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
