import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { sendPasswordResetCode } from '@/lib/mailer';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    await connectDB();

    const user = await User.findOne({ email }).select('+resetPasswordCode +resetPasswordExpires');

    if (!user) {
      return NextResponse.json({
        message: 'If that account exists, a reset code has been sent to the email address.',
      });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    user.resetPasswordCode = hashedCode;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetCode(email, code);

    return NextResponse.json({
      message: 'Reset code sent to your email.',
    });
  } catch (error: unknown) {
    console.error('[FORGOT PASSWORD REQUEST ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
