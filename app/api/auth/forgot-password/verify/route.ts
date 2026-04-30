import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Startup from '@/models/Startup';
import { linkResidentByEmail } from '@/lib/link-resident';

const verifySchema = z.object({
  email: z.string().email('Noto‘g‘ri email'),
  code: z.string().length(6, 'Kod 6 raqamdan iborat'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat'),
});

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function POST(req: NextRequest) {
  try {
    const parsed = verifySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const hashedCode = crypto.createHash('sha256').update(parsed.data.code).digest('hex');

    await connectDB();

    // Try to find user by email first
    let user = await User.findOne({ email })
      .select('+password +resetPasswordCode +resetPasswordExpires');

    // Fall back to matching by an imported resident's Startup.gmail
    if (!user) {
      const startup = await Startup.findOne({
        gmail: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
        deletedAt: null,
      }).select('userId').lean();
      if (startup?.userId) {
        user = await User.findById(startup.userId)
          .select('+password +resetPasswordCode +resetPasswordExpires');
      }
    }

    if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
      return NextResponse.json({ error: 'Avval kod so‘rang' }, { status: 400 });
    }

    if (user.resetPasswordExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Tasdiqlash kodi muddati o‘tdi' }, { status: 400 });
    }

    if (hashedCode !== user.resetPasswordCode) {
      return NextResponse.json({ error: 'Tasdiqlash kodi noto‘g‘ri' }, { status: 400 });
    }

    user.password = parsed.data.password;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    user.emailVerified = true;
    user.status = 'active';

    // If the user record was a placeholder with synthetic email, promote to the real email used here
    if (user.email.endsWith('@startupgarage.local')) {
      user.email = email;
    }

    await user.save();

    // If a startup was linked via this gmail, ensure the userId points at this user
    try { await linkResidentByEmail(user._id, email); } catch (e) { console.error('[forgot-password/verify] link', e); }

    return NextResponse.json({ message: 'Parol yangilandi' });
  } catch (error: unknown) {
    console.error('[POST /api/auth/forgot-password/verify]', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
