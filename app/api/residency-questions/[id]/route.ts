import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import ResidencyQuestion from '@/models/ResidencyQuestion';

const questionUpdateSchema = z.object({
  question: z.string().min(3).optional(),
  placeholder: z.string().optional(),
  type: z.enum(['text', 'textarea', 'url']).optional(),
  required: z.boolean().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
}).strict();

async function authorize() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const user = session.user as { role: string };
  if (!['manager', 'super_admin'].includes(user.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { error: null };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = questionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation error' }, { status: 400 });
    }

    await connectDB();
    const question = await ResidencyQuestion.findByIdAndUpdate(params.id, { $set: parsed.data }, { new: true }).lean();
    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ question });
  } catch (error) {
    console.error('[PATCH /api/residency-questions/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  try {
    await connectDB();
    await ResidencyQuestion.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/residency-questions/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
