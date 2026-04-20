import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import SprintTask from '@/models/SprintTask';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const tasks = await SprintTask.find({})
      .populate('createdBy', 'name surname')
      .sort({ quarter: 1, month: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('[GET /api/sprint-tasks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.quarter || !body.month) {
      return NextResponse.json({ error: 'title, quarter, month required' }, { status: 400 });
    }

    await connectDB();
    const task = await SprintTask.create({ ...body, createdBy: user.id });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sprint-tasks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
