import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import GtmItem from '@/models/GtmItem';
import { hasActiveStartup } from '@/lib/access';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = session.user as { id: string; role: string };
    if (user.role === 'user' && !(await hasActiveStartup(user.id))) {
      return NextResponse.json({ items: [] });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || '';

    const query: Record<string, string> = {};
    if (type) query.type = type;

    const items = await GtmItem.find(query)
      .populate('createdBy', 'name surname')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[GET /api/gtm]', err);
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
    if (!body.title || !body.content || !body.type || !body.category) {
      return NextResponse.json({ error: 'title, content, type and category are required' }, { status: 400 });
    }

    await connectDB();
    const item = await GtmItem.create({ ...body, createdBy: user.id });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/gtm]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
