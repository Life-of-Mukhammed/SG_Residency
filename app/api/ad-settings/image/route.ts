import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import AdSettings from '@/models/AdSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const settings = await AdSettings.findOne().select('bannerImage').lean() as any;
    const image = settings?.bannerImage || '';
    return NextResponse.json({ image }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ image: '' });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 });

    const user = session.user as { role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();

    await AdSettings.findOneAndUpdate(
      {},
      { $set: { bannerImage: body.bannerImage ?? '' } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/ad-settings/image]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
