import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Startup from '@/models/Startup';
import { sendVerificationCode } from '@/lib/mailer';

const requestSchema = z.object({
  email: z.string().email('Noto‘g‘ri email manzili'),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Email noto‘g‘ri' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    if (email.endsWith('@startupgarage.local')) {
      return NextResponse.json({ error: 'Bu email manzili foydalanish uchun band' }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email }).select('+password +verificationCode +verificationExpires');

    // Block already-completed accounts (real users with passwords)
    if (existingUser?.password) {
      return NextResponse.json({ error: 'Bu email allaqachon ro‘yxatdan o‘tgan. Kiring.' }, { status: 400 });
    }

    // Detect if this email belongs to an imported resident (so we can show different copy)
    const linkedStartup = await Startup.findOne({
      gmail: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
      deletedAt: null,
    }).select('_id startup_name').lean();

    // Generate a 6-digit code
    const code = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser) {
      existingUser.verificationCode = hashedCode;
      existingUser.verificationExpires = expires;
      await existingUser.save();
    } else {
      // Pre-create a placeholder user that becomes a real account once OTP is verified
      await User.create({
        email,
        name: 'Pending',
        surname: 'User',
        role: 'user',
        verificationCode: hashedCode,
        verificationExpires: expires,
        emailVerified: false,
      });
    }

    try {
      await sendVerificationCode(email, code, Boolean(linkedStartup));
    } catch (mailError: any) {
      console.error('[register/request] mail error', mailError);
      const errCode = mailError?.code as string | undefined;
      const userMessage =
        errCode === 'EAUTH'
          ? 'Email server autentifikatsiyasi noto‘g‘ri. Admin Gmail App Password ni .env faylida yangilashi kerak.'
          : errCode === 'ECONNECTION' || errCode === 'ETIMEDOUT'
            ? 'Email serverga ulanib bo‘lmadi. Internet yoki SMTP sozlamasini tekshiring.'
            : 'Tasdiqlash kodi yuborilmadi. Email manzilini tekshirib qayta urinib ko‘ring.';
      return NextResponse.json({ error: userMessage }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Tasdiqlash kodi yuborildi.',
      isResident: Boolean(linkedStartup),
      startupName: linkedStartup?.startup_name ?? null,
    });
  } catch (error) {
    console.error('[POST /api/auth/register/request]', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
