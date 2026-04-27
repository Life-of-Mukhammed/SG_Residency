import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Startup from '@/models/Startup';
import { notifyUsers } from '@/lib/notifications';
import { z } from 'zod';
import { STARTUP_SPHERES } from '@/lib/startup-spheres';

const startupUpdateSchema = z.object({
  status: z.enum(['pending', 'lead_accepted', 'active', 'inactive', 'rejected']).optional(),
  managerId: z.string().optional(),
  rejectionReason: z.string().trim().max(500).optional(),
  startup_name: z.string().min(1).optional(),
  description: z.string().optional(),
  startup_sphere: z.enum(STARTUP_SPHERES).optional(),
  stage: z.enum(['idea', 'mvp', 'growth', 'scale']).optional(),
  region: z.string().optional(),
  founder_name: z.string().optional(),
  phone: z.string().optional(),
  telegram: z.string().optional(),
  pitch_deck: z.string().optional(),
  resume_url: z.string().optional(),
  team_size: z.coerce.number().min(1).optional(),
  mrr: z.coerce.number().min(0).optional(),
  users_count: z.coerce.number().min(0).optional(),
  investment_raised: z.coerce.number().min(0).optional(),
  commitment: z.enum(['full-time', 'part-time']).optional(),
  acceptedAt: z.string().optional(),
});

const startupOwnerUpdateSchema = z.object({
  startup_name: z.string().min(1).optional(),
  pitch_deck: z.string().optional(),
  startup_sphere: z.enum(STARTUP_SPHERES).optional(),
  mrr: z.coerce.number().min(0).optional(),
  users_count: z.coerce.number().min(0).optional(),
  investment_raised: z.coerce.number().min(0).optional(),
  team_size: z.coerce.number().min(1).optional(),
}).strict();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    await connectDB();
    const startup = await Startup.findById(params.id)
      .populate('userId',    'name surname email')
      .populate('managerId', 'name surname email')
      .lean();

    if (!startup) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const ownerId =
      typeof startup.userId === 'object' && startup.userId && '_id' in startup.userId
        ? String(startup.userId._id)
        : String(startup.userId);
    if (user.role === 'user' && ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ startup });
  } catch (err) {
    console.error('[GET /api/startups/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    const body = await req.json();
    await connectDB();

    const current = await Startup.findById(params.id).lean();
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (user.role === 'user') {
      if (String(current.userId) !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const parsed = startupOwnerUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
      }

      const startup = await Startup.findByIdAndUpdate(
        params.id,
        { $set: parsed.data },
        { new: true }
      ).populate('userId', 'name surname email').lean();

      return NextResponse.json({ startup });
    }

    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = startupUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    if (parsed.data.status === 'rejected' && !parsed.data.rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const { acceptedAt: acceptedAtRaw, ...restData } = parsed.data;
    const patch: Record<string, unknown> = { ...restData };
    if (acceptedAtRaw !== undefined) {
      patch.acceptedAt = acceptedAtRaw ? new Date(acceptedAtRaw) : null;
    }
    if (parsed.data.status === 'active' && !current.managerId) {
      patch.managerId = user.id;
    }
    if (parsed.data.status === 'active') {
      patch.rejectionReason = '';
      if (current.status !== 'active') patch.acceptedAt = new Date();
    }
    if (parsed.data.status === 'pending') {
      patch.rejectionReason = '';
    }
    if (parsed.data.status === 'lead_accepted' && !current.managerId) {
      patch.managerId = user.id;
      patch.rejectionReason = '';
    }

    const startup = await Startup.findByIdAndUpdate(
      params.id,
      { $set: patch },
      { new: true }
    ).populate('userId', 'name surname email').lean();

    if (!startup) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (typeof parsed.data.status === 'string' && parsed.data.status !== current.status) {
      const userId = typeof startup.userId === 'object' && startup.userId && '_id' in startup.userId
        ? String(startup.userId._id)
        : String(current.userId);

      const STATUS_NOTIFY: Record<string, { title: string; message: string }> = {
        active: {
          title: '🎉 Rezidentlikka qabul qilindingiz!',
          message: `Tabriklaymiz! <b>${startup.startup_name}</b> Startup Garage rezidentligiga qabul qilindi.\n\nEndi sizga barcha imkoniyatlar ochiq: hisobotlar, uchrashuvlar, sprint va GTM.`,
        },
        lead_accepted: {
          title: '📅 Sizni intervyuga taklif qilamiz!',
          message: `<b>${startup.startup_name}</b> arizasi ko'rib chiqildi va siz keyingi bosqichga o'tdingiz.\n\nManeger tez orada siz bilan uchrashuvni tashkil qiladi. Uchrashuvlar bo'limiga e'tibor bering.`,
        },
        rejected: {
          title: '❌ Ariza rad etildi',
          message: `Afsuski, <b>${startup.startup_name}</b> arizasi qabul qilinmadi.\n\nSabab: ${parsed.data.rejectionReason?.trim() || 'Ko\'rsatilmagan.'}\n\nSavollar bo'lsa, support bilan bog'laning.`,
        },
        inactive: {
          title: '⚠️ Startup statusi o\'zgartirildi',
          message: `<b>${startup.startup_name}</b> statusi <b>inactive</b> ga o'zgartirildi. Batafsil ma'lumot uchun manager bilan bog'laning.`,
        },
        pending: {
          title: '⏳ Ariza ko\'rib chiqilmoqda',
          message: `<b>${startup.startup_name}</b> arizasi ko'rib chiqish bosqichiga qaytarildi. Natija haqida xabardor qilinasiz.`,
        },
      };

      const notify = STATUS_NOTIFY[parsed.data.status] ?? {
        title: 'Status yangilandi',
        message: `${startup.startup_name} statusi <b>${parsed.data.status}</b> ga o'zgartirildi.`,
      };

      await notifyUsers([userId], {
        title: notify.title,
        message: notify.message,
        type: 'info',
        channels: { inApp: true, email: true, telegram: true },
      });
    }

    return NextResponse.json({ startup });
  } catch (err) {
    console.error('[PATCH /api/startups/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    await Startup.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[DELETE /api/startups/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
