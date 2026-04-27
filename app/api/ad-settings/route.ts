import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import AdSettings from '@/models/AdSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    let settings = await AdSettings.findOne().select('-bannerImage').lean();
    if (!settings) {
      await AdSettings.create({});
      settings = await AdSettings.findOne().select('-bannerImage').lean();
    }
    return NextResponse.json({ settings }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[GET /api/ad-settings]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 });

    const user = session.user as { role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();

    const settings = await AdSettings.findOneAndUpdate(
      {},
      { $set: {
        title:         body.title,
        description:   body.description,
        websiteUrl:    body.websiteUrl,
        appStoreUrl:   body.appStoreUrl,
        googlePlayUrl: body.googlePlayUrl,
        enabled:       body.enabled,
      }},
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[PUT /api/ad-settings]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
