import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { notifyRoles } from '@/lib/notifications';
import { linkResidentByEmail } from '@/lib/link-resident';

const registerSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak'),
  surname: z.string().min(2, 'Familiya kamida 2 ta belgidan iborat bo‘lishi kerak'),
  email: z.string().email('Noto‘g‘ri email'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak'),
  otp: z.string().regex(/^\d{6}$/, 'Tasdiqlash kodi 6 raqamdan iborat bo‘lishi kerak'),
});

export async function POST(req: NextRequest) {
  try {
    const result = registerSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Validation failed' }, { status: 400 });
    }

    const { name, surname, email, password, otp } = result.data;
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail.endsWith('@startupgarage.local')) {
      return NextResponse.json({ error: 'Bu email manzili foydalanish uchun band' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail })
      .select('+password +verificationCode +verificationExpires');

    if (!user || !user.verificationCode || !user.verificationExpires) {
      return NextResponse.json({ error: 'Avval tasdiqlash kodini so‘rang.' }, { status: 400 });
    }

    if (user.password) {
      return NextResponse.json({ error: 'Bu email allaqachon ro‘yxatdan o‘tgan. Kiring.' }, { status: 400 });
    }

    if (user.verificationExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Tasdiqlash kodi muddati o‘tdi. Qayta so‘rang.' }, { status: 400 });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== user.verificationCode) {
      return NextResponse.json({ error: 'Tasdiqlash kodi noto‘g‘ri.' }, { status: 400 });
    }

    user.name = name;
    user.surname = surname;
    user.password = password; // hashed by pre-validate hook
    user.role = user.role || 'user';
    user.status = 'active';
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    user.deletedAt = undefined;
    await user.save();

    const linkedStartup = await linkResidentByEmail(user._id, normalizedEmail);

    await notifyRoles(['manager', 'super_admin'], {
      title: linkedStartup ? '🔗 Resident linked' : '👤 New user registered',
      message: linkedStartup
        ? `${name} ${surname} (${normalizedEmail}) registered and was auto-linked to existing resident <b>${linkedStartup.startup_name}</b>.`
        : `${name} ${surname} (${normalizedEmail}) just created an account on Startup Garage.`,
      type: 'info',
      channels: { inApp: true, email: true, telegram: true },
    });

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      linkedStartup: linkedStartup
        ? { id: String(linkedStartup._id), name: linkedStartup.startup_name }
        : null,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('[REGISTER ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 });
  }
}
