import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import GtmConfig from '@/models/GtmConfig';

const DEFAULT_CONFIG = {
  title: 'Asoschilar uchun 90 kunlik GTM qo‘llanmasi',
  intro:
    'Har bir asoschiga pullik reklamalarsiz, PR agentliklarisiz va yirik marketing guruhlarisiz ko‘rinish, ishonch va jalb qilish qobiliyatini oshirishga yordam berish uchun.',
  quote:
    'Har qanday startapning eng katta boyligi reklama emas, balki ishonchdir. 90 kun ichida siz bozor ishonchini reklama orqali emas, balki o‘zingizning hikoyangiz, ishtirokingiz va jamoangiz orqali qozonishingiz mumkin.',
  quoteAuthor: 'Startup Garage asoschisi',
  sections: [
    { key: 'guide', title: 'Asoschining GTM Dasturi (O‘qish bo‘limi)' },
    { key: 'plan', title: '90 Kunlik Amalaga Oshirish Rejasi' },
    { key: 'system', title: '90 Kunlik GTM OT (Operation Tizimi)' },
  ],
};

async function getOrCreateConfig() {
  let config = await GtmConfig.findOne().lean();
  if (!config) {
    const created = await GtmConfig.create(DEFAULT_CONFIG);
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
    console.error('[GET /api/gtm/config]', error);
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
    await connectDB();
    const current = await getOrCreateConfig();

    const config = await GtmConfig.findByIdAndUpdate(
      current._id,
      {
        $set: {
          title: body.title,
          intro: body.intro,
          quote: body.quote,
          quoteAuthor: body.quoteAuthor,
          sections: body.sections,
        },
      },
      { new: true }
    ).lean();

    return NextResponse.json({ config });
  } catch (error) {
    console.error('[PATCH /api/gtm/config]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
