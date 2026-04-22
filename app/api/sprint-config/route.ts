import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import SprintConfig from '@/models/SprintConfig';

const DEFAULT_CONFIG = {
  quarters: [
    {
      quarter: 1,
      name: 'Q1',
      months: [
        { month: 1, name: 'Month 1' },
        { month: 2, name: 'Month 2' },
        { month: 3, name: 'Month 3' },
      ],
    },
    {
      quarter: 2,
      name: 'Q2',
      months: [
        { month: 1, name: 'Month 1' },
        { month: 2, name: 'Month 2' },
        { month: 3, name: 'Month 3' },
      ],
    },
    {
      quarter: 3,
      name: 'Q3',
      months: [
        { month: 1, name: 'Month 1' },
        { month: 2, name: 'Month 2' },
        { month: 3, name: 'Month 3' },
      ],
    },
    {
      quarter: 4,
      name: 'Q4',
      months: [
        { month: 1, name: 'Month 1' },
        { month: 2, name: 'Month 2' },
        { month: 3, name: 'Month 3' },
      ],
    },
  ],
};

async function getOrCreateConfig() {
  let config = await SprintConfig.findOne().lean();
  if (!config) {
    const created = await SprintConfig.create(DEFAULT_CONFIG);
    config = created.toObject();
  }
  return config;
}

export async function GET() {
  try {
    await connectDB();
    const config = await getOrCreateConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('[GET /api/sprint-config]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!Array.isArray(body.quarters)) {
      return NextResponse.json({ error: 'quarters are required' }, { status: 400 });
    }

    await connectDB();
    const current = await getOrCreateConfig();
    const config = await SprintConfig.findByIdAndUpdate(
      current._id,
      { $set: { quarters: body.quarters } },
      { new: true }
    ).lean();

    return NextResponse.json({ config });
  } catch (error) {
    console.error('[PATCH /api/sprint-config]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
