import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Startup from '@/models/Startup';
import { notifyRoles } from '@/lib/notifications';
import { z } from 'zod';
import User from '@/models/User';
import { DEFAULT_STARTUP_SPHERE, STARTUP_SPHERES } from '@/lib/startup-spheres';

const startupSchema = z.object({
  applicationType:   z.enum(['existing_resident', 'new_applicant']),
  name:              z.string().optional(),
  surname:           z.string().optional(),
  gmail:             z.string().email().optional(),
  startup_name:      z.string().min(1),
  region:            z.string().optional(),
  startup_logo:      z.string().optional(),
  description:       z.string().optional(),
  startup_sphere:    z.enum(STARTUP_SPHERES).optional(),
  stage:             z.enum(['idea', 'mvp', 'growth', 'scale']).optional(),
  founder_name:      z.string().optional(),
  phone:             z.string().optional(),
  telegram:          z.string().optional(),
  team_size:         z.coerce.number().optional(),
  pitch_deck:        z.string().min(1),
  resume_url:        z.string().optional(),
  commitment:        z.enum(['full-time', 'part-time']).optional(),
  mrr:               z.coerce.number().default(0),
  users_count:       z.coerce.number().default(0),
  investment_raised: z.coerce.number().default(0),
  applicationAnswers: z.array(
    z.object({
      questionId: z.string().optional(),
      question: z.string().min(1),
      answer: z.string().min(1),
    })
  ).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get('page')  || '1');
    const limit  = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const stage  = searchParams.get('stage')  || '';
    const status = searchParams.get('status') || '';
    const sphere = searchParams.get('sphere') || '';
    const region = searchParams.get('region') || '';

    const user = session.user as { id: string; role: string };
    const query: Record<string, unknown> = {};

    if (user.role === 'user') query.userId = user.id;
    if (search) {
      query.$or = [
        { startup_name:  { $regex: search, $options: 'i' } },
        { founder_name:  { $regex: search, $options: 'i' } },
        { region:        { $regex: search, $options: 'i' } },
      ];
    }
    if (stage)  query.stage  = stage;
    if (status) query.status = status;
    if (sphere) query.startup_sphere = sphere;
    if (region) query.region = { $regex: `^${region}$`, $options: 'i' };

    const total    = await Startup.countDocuments(query);
    const startups = await Startup.find(query)
      .populate('userId',    'name surname email')
      .populate('managerId', 'name surname email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      startups,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /api/startups]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body   = await req.json();
    const result = startupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Validation error' }, { status: 400 });
    }

    await connectDB();

    const user = session.user as { id: string; role: string };
    const currentUser = await User.findById(user.id).lean();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payload = result.data;

    if (payload.applicationType === 'new_applicant') {
      if (!payload.resume_url?.trim()) {
        return NextResponse.json({ error: 'Resume is required for new applicants' }, { status: 400 });
      }
      if (!payload.description || payload.description.trim().length < 20) {
        return NextResponse.json({ error: 'Description must be at least 20 characters' }, { status: 400 });
      }
      if (!payload.startup_sphere || !payload.region || !payload.founder_name || !payload.phone || !payload.telegram) {
        return NextResponse.json({ error: 'Please complete all required founder and startup fields' }, { status: 400 });
      }
    }

    const normalizedData = {
      applicationType: payload.applicationType,
      name: payload.name?.trim() || currentUser.name,
      surname: payload.surname?.trim() || currentUser.surname,
      gmail: payload.gmail?.trim().toLowerCase() || currentUser.email,
      startup_name: payload.startup_name.trim(),
      region: payload.region?.trim() || 'Tashkent',
      startup_logo: payload.startup_logo?.trim() || '',
      description:
        payload.applicationType === 'existing_resident'
          ? payload.description?.trim() || 'Existing Startup Garage resident requested residency access.'
          : payload.description?.trim() || '',
      startup_sphere:
        payload.applicationType === 'existing_resident'
          ? payload.startup_sphere?.trim() || DEFAULT_STARTUP_SPHERE
          : payload.startup_sphere?.trim() || '',
      stage:
        payload.applicationType === 'existing_resident'
          ? payload.stage || 'mvp'
          : payload.stage || 'idea',
      founder_name: payload.founder_name?.trim() || `${currentUser.name} ${currentUser.surname}`,
      phone: payload.phone?.trim() || 'Not provided',
      telegram: payload.telegram?.trim() || '@not_provided',
      team_size: payload.team_size || 1,
      pitch_deck: payload.pitch_deck.trim(),
      resume_url: payload.resume_url?.trim() || '',
      applicationAnswers: payload.applicationAnswers || [],
      commitment: payload.commitment || 'full-time',
      mrr: payload.mrr || 0,
      users_count: payload.users_count || 0,
      investment_raised: payload.investment_raised || 0,
      status: 'pending' as const,
      rejectionReason: '',
      managerId: undefined,
    };

    if (user.role === 'user') {
      const existing = await Startup.findOne({ userId: user.id });
      if (existing) {
        if (existing.status === 'rejected') {
          const startup = await Startup.findByIdAndUpdate(
            existing._id,
            { $set: normalizedData },
            { new: true }
          );

          await notifyRoles(['manager', 'super_admin'], {
            title: 'Residency application re-submitted',
            message: `${normalizedData.founder_name} re-submitted ${normalizedData.startup_name} for review.`,
            type: 'info',
          });

          return NextResponse.json({ startup }, { status: 200 });
        }

        return NextResponse.json({ error: 'You already have a startup application' }, { status: 400 });
      }
    }

    const startup = await Startup.create({ ...normalizedData, userId: user.id });
    await notifyRoles(['manager', 'super_admin'], {
      title: 'New residency application',
      message:
        normalizedData.applicationType === 'existing_resident'
          ? `${normalizedData.founder_name} requested residency access for ${normalizedData.startup_name}.`
          : `${normalizedData.founder_name} submitted ${normalizedData.startup_name} as a new lead.`,
      type: 'info',
    });

    return NextResponse.json({ startup }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/startups]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
