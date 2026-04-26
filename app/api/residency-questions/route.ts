import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import ResidencyQuestion from '@/models/ResidencyQuestion';

const questionSchema = z.object({
  question: z.string().min(3),
  placeholder: z.string().optional().default(''),
  type: z.enum(['text', 'textarea', 'url']).default('textarea'),
  required: z.boolean().default(true),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
});

const DEFAULT_QUESTIONS = [
  {
    question: 'Nima uchun aynan Startup Garage residency dasturiga qo‘shilmoqchisiz?',
    placeholder: 'Bizga nima uchun bu residency siz uchun muhim ekanini yozing...',
    type: 'textarea' as const,
    required: true,
    order: 1,
    isActive: true,
  },
  {
    question: 'Oxirgi 6 oy ichida startupingizda qanday asosiy natijalarga erishdingiz?',
    placeholder: 'Traction, user growth, revenue, pilots yoki boshqa ko‘rsatkichlarni yozing...',
    type: 'textarea' as const,
    required: true,
    order: 2,
    isActive: true,
  },
  {
    question: 'LinkedIn yoki portfolio havolasi',
    placeholder: 'https://...',
    type: 'url' as const,
    required: false,
    order: 3,
    isActive: true,
  },
];

async function ensureDefaultQuestions() {
  const count = await ResidencyQuestion.countDocuments();
  if (count > 0) return;
  await ResidencyQuestion.insertMany(DEFAULT_QUESTIONS);
}

export async function GET() {
  try {
    await connectDB();
    await ensureDefaultQuestions();
    const questions = await ResidencyQuestion.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('[GET /api/residency-questions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation error' }, { status: 400 });
    }

    await connectDB();
    const question = await ResidencyQuestion.create(parsed.data);
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/residency-questions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
