import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Startup from '@/models/Startup';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  surname: z.string().min(2, 'Surname must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  avatar: z.string().refine(
    (value) => !value || value.startsWith('data:image/') || /^https?:\/\//.test(value),
    'Avatar must be a valid image URL or uploaded image'
  ).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.newPassword && !data.currentPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currentPassword'],
      message: 'Current password is required to change your password',
    });
  }
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const userId = (session.user as { id: string }).id;
    const [user, startup] = await Promise.all([
      User.findById(userId).select('-password').lean(),
      Startup.findOne({ userId }).lean(),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user, startup });
  } catch (error) {
    console.error('[GET /api/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation failed' }, { status: 400 });
    }

    await connectDB();

    const userId = (session.user as { id: string }).id;
    const currentUser = await User.findById(userId).select('+password');
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const emailTaken = await User.findOne({
      _id: { $ne: userId },
      email: parsed.data.email.toLowerCase(),
    }).lean();
    if (emailTaken) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    if (parsed.data.newPassword) {
      const valid = await currentUser.comparePassword(parsed.data.currentPassword || '');
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      currentUser.password = parsed.data.newPassword;
    }

    currentUser.name = parsed.data.name.trim();
    currentUser.surname = parsed.data.surname.trim();
    currentUser.email = parsed.data.email.toLowerCase().trim();
    currentUser.avatar = parsed.data.avatar?.trim() || '';
    await currentUser.save();

    const safeUser = await User.findById(userId).select('-password').lean();
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('[PATCH /api/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
