import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import SprintTask from '@/models/SprintTask';

// Sprint task definitions are global config and rarely change — cache to avoid hitting Mongo on every dashboard navigation.
let cache: { at: number; data: unknown } | null = null;
const TTL_MS = 60_000;

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (cache && Date.now() - cache.at < TTL_MS) {
      return NextResponse.json(cache.data);
    }

    await connectDB();
    const tasks = await SprintTask.find({})
      .select('quarter month title description createdAt createdBy')
      .sort({ quarter: 1, month: 1, createdAt: -1 })
      .lean();

    const payload = { tasks };
    cache = { at: Date.now(), data: payload };
    return NextResponse.json(payload);
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
    cache = null;
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sprint-tasks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
