import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Startup from '@/models/Startup';
import User from '@/models/User';
import { notifyUsers } from '@/lib/notifications';
import { z } from 'zod';
import { STARTUP_SPHERES } from '@/lib/startup-spheres';
import AuditLog from '@/models/AuditLog';
import RejectedLead from '@/models/RejectedLead';

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
  gmail: z.string().trim().toLowerCase().optional(),
  leadStatus: z.string().trim().optional(),
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
    const startup = await Startup.findOne({ _id: params.id, deletedAt: null })
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

    const current = await Startup.findOne({ _id: params.id, deletedAt: null }).lean();
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
    if (acceptedAtRaw) {
      patch.acceptedAt = new Date(acceptedAtRaw);
    } else if (!current.acceptedAt) {
      const effectiveStatus = (parsed.data.status as string | undefined) ?? current.status;
      if (effectiveStatus === 'active') {
        patch.acceptedAt = current.updatedAt ?? new Date();
      }
    }

    // If manager set a new real gmail (not the @startupgarage.local placeholder), try to
    // find a registered user with that email and re-link the startup to that account.
    const newGmail = parsed.data.gmail?.trim().toLowerCase();
    if (newGmail && !newGmail.endsWith('@startupgarage.local') && newGmail !== current.gmail?.toLowerCase()) {
      const realUser = await User.findOne({ email: newGmail });
      if (realUser && String(realUser._id) !== String(current.userId)) {
        // The new user might already own a separate (usually empty) Startup that they
        // self-submitted before the link. The Startup.userId index is unique so we have
        // to soft-delete that fresh application before re-pointing this resident.
        const conflicting = await Startup.findOne({
          userId: realUser._id,
          deletedAt: null,
          _id: { $ne: current._id },
        });
        if (conflicting) {
          const isAbandonable = conflicting.status === 'pending' && conflicting.applicationType === 'new_applicant';
          if (isAbandonable) {
            await Startup.findByIdAndUpdate(conflicting._id, {
              $set: { deletedAt: new Date(), status: 'inactive' },
            });
          } else {
            // Active or already-residency record blocks the auto-link; surface a warning instead of failing silently
            console.warn('[startups PATCH] cannot re-link, target user already owns active startup', {
              targetStartup: String(current._id),
              ownerStartup:  String(conflicting._id),
              newOwner:      String(realUser._id),
            });
          }
        }
        // Re-check after potential cleanup
        const stillConflicting = await Startup.exists({
          userId: realUser._id,
          deletedAt: null,
          _id: { $ne: current._id },
        });
        if (!stillConflicting) {
          const oldOwner = await User.findById(current.userId).select('email password').lean();
          patch.userId = realUser._id;
          if (oldOwner && typeof oldOwner.email === 'string' && oldOwner.email.endsWith('@startupgarage.local') && !oldOwner.password) {
            await User.findByIdAndDelete(current.userId);
          }
        }
      }
    }
    if (parsed.data.status === 'active' && !current.managerId) {
      patch.managerId = user.id;
    }
    if (parsed.data.status === 'active') {
      patch.rejectionReason = '';
      patch.rejectedAt = undefined;
      if (current.status !== 'active') patch.acceptedAt = new Date();
    }
    if (parsed.data.status === 'pending') {
      patch.rejectionReason = '';
      patch.rejectedAt = undefined;
    }
    if (parsed.data.status === 'lead_accepted' && !current.managerId) {
      patch.managerId = user.id;
      patch.rejectionReason = '';
    }
    if (parsed.data.status === 'rejected') {
      patch.rejectedAt = new Date();
    }

    const update: Record<string, unknown> = { $set: patch };
    if (parsed.data.status && parsed.data.status !== current.status) {
      update.$push = {
        statusHistory: {
          from: current.status,
          to: parsed.data.status,
          reason: parsed.data.rejectionReason?.trim() || '',
          actorId: user.id,
          changedAt: new Date(),
        },
      };
    }

    const startup = await Startup.findByIdAndUpdate(
      params.id,
      update,
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
          message: `<b>${startup.startup_name}</b> arizasi ko'rib chiqildi va siz keyingi bosqichga o'tdingiz.\n\nManager bilan bog‘lanish uchun ‘Uchrashuv’ bo‘limiga kirib, o‘zingizga mos vaqtni tanlab, meeting belgilang.`,
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

      await AuditLog.create({
        actorId: user.id,
        action: 'startup_status_changed',
        entityType: 'Startup',
        entityId: params.id,
        metadata: { from: current.status, to: parsed.data.status },
      });

      if (parsed.data.status === 'rejected') {
        await RejectedLead.findOneAndUpdate(
          { startupId: startup._id },
          {
            startupId: startup._id,
            startupName: startup.startup_name,
            founderName: startup.founder_name,
            phone: startup.phone,
            telegram: startup.telegram,
            region: startup.region,
            rejectionReason: parsed.data.rejectionReason?.trim() || '',
            rejectedAt: new Date(),
            rejectedBy: user.id,
          },
          { upsert: true, new: true }
        );
      }
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
    const startup = await Startup.findOneAndUpdate(
      { _id: params.id, deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: user.id, status: 'inactive' } },
      { new: true }
    ).lean();
    if (!startup) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await AuditLog.create({
      actorId: user.id,
      action: 'startup_soft_deleted',
      entityType: 'Startup',
      entityId: params.id,
      metadata: { startup_name: (startup as any).startup_name },
    });
    return NextResponse.json({ message: 'Soft deleted' });
  } catch (err) {
    console.error('[DELETE /api/startups/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
