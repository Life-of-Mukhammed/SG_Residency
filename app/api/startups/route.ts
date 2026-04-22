import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Startup from '@/models/Startup';
import { notifyRoles } from '@/lib/notifications';
import { z } from 'zod';

const startupSchema = z.object({
  name:              z.string().min(1),
  surname:           z.string().min(1),
  gmail:             z.string().email(),
  startup_name:      z.string().min(1),
  region:            z.string().min(1),
  startup_logo:      z.string().optional(),
  description:       z.string().min(10),
  startup_sphere:    z.string().min(1),
  stage:             z.enum(['idea', 'mvp', 'growth', 'scale']),
  founder_name:      z.string().min(1),
  phone:             z.string().min(1),
  telegram:          z.string().min(1),
  team_size:         z.coerce.number().min(1),
  pitch_deck:        z.string().optional(),
  commitment:        z.enum(['full-time', 'part-time']),
  mrr:               z.coerce.number().default(0),
  users_count:       z.coerce.number().default(0),
  investment_raised: z.coerce.number().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get('page')  || '1');
    const limit  = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const stage  = searchParams.get('stage')  || '';
    const status = searchParams.get('status') || '';
    const sphere = searchParams.get('sphere') || '';
    const region = searchParams.get('region') || '';

    const user = session.user as { id: string; role: string };
    const query: Record<string, unknown> = {};

    if (user.role === 'user') query.userId = user.id;
    if (search) {
      query.$or = [
        { startup_name:  { $regex: search, $options: 'i' } },
        { founder_name:  { $regex: search, $options: 'i' } },
        { region:        { $regex: search, $options: 'i' } },
      ];
    }
    if (stage)  query.stage  = stage;
    if (status) query.status = status;
    if (sphere) query.startup_sphere = sphere;
    if (region) query.region = { $regex: `^${region}$`, $options: 'i' };

    const total    = await Startup.countDocuments(query);
    const startups = await Startup.find(query)
      .populate('userId',    'name surname email')
      .populate('managerId', 'name surname email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      startups,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /api/startups]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body   = await req.json();
    const result = startupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Validation error' }, { status: 400 });
    }

    await connectDB();

    const user = session.user as { id: string; role: string };

    if (user.role === 'user') {
      const existing = await Startup.findOne({ userId: user.id });
      if (existing) {
        return NextResponse.json({ error: 'You already have a startup application' }, { status: 400 });
      }
    }

    const startup = await Startup.create({ ...result.data, userId: user.id });
    await notifyRoles(['manager', 'super_admin'], {
      title: 'New residency application',
      message: `${result.data.founder_name} submitted ${result.data.startup_name} for review.`,
      type: 'info',
    });

    return NextResponse.json({ startup }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/startups]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
