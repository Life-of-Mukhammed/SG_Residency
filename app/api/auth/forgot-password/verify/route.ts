import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';

const verifySchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Code must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const hashedCode = crypto.createHash('sha256').update(parsed.data.code).digest('hex');

    await connectDB();

    const user = await User.findOne({
      email,
      resetPasswordCode: hashedCode,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password +resetPasswordCode +resetPasswordExpires');

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 });
    }

    user.password = parsed.data.password;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      message: 'Password updated successfully.',
    });
  } catch (error: unknown) {
    console.error('[FORGOT PASSWORD VERIFY ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
