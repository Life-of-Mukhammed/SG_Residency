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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function POST(req: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Email noto‘g‘ri' }, { status: 400 });
    }

    const inputEmail = parsed.data.email.toLowerCase().trim();
    if (inputEmail.endsWith('@startupgarage.local')) {
      return NextResponse.json(
        { error: 'Bu placeholder email. Iltimos haqiqiy gmail manzilingiz bilan urinib ko‘ring.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Look up by User.email first, then by Startup.gmail (resident imported with this gmail)
    let user = await User.findOne({ email: inputEmail })
      .select('+verificationCode +verificationExpires');

    let viaResident = false;
    if (!user) {
      const startup = await Startup.findOne({
        gmail: { $regex: `^${escapeRegex(inputEmail)}$`, $options: 'i' },
        deletedAt: null,
      }).select('userId').lean();
      if (startup?.userId) {
        user = await User.findById(startup.userId)
          .select('+verificationCode +verificationExpires');
        viaResident = true;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Bu email bo‘yicha akkount topilmadi' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    user.verificationCode = hashedCode;
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationCode(inputEmail, code, viaResident);
    } catch (mailError: any) {
      console.error('[login/request] mail error', mailError);
      const errCode = mailError?.code as string | undefined;
      const userMessage =
        errCode === 'EAUTH'
          ? 'Email server autentifikatsiyasi noto‘g‘ri. Admin Gmail App Password ni .env faylida yangilashi kerak.'
          : errCode === 'ECONNECTION' || errCode === 'ETIMEDOUT'
            ? 'Email serverga ulanib bo‘lmadi.'
            : 'Kod yuborib bo‘lmadi. Iltimos qayta urinib ko‘ring.';
      return NextResponse.json({ error: userMessage }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Kirish kodi emailingizga yuborildi',
      isResident: viaResident,
    });
  } catch (error) {
    console.error('[POST /api/auth/login/request]', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
