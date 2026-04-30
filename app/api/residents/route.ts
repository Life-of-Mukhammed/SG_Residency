import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Startup from '@/models/Startup';
import AuditLog from '@/models/AuditLog';
import { DEFAULT_STARTUP_SPHERE, STARTUP_SPHERES } from '@/lib/startup-spheres';

export const dynamic = 'force-dynamic';

const residentSchema = z.object({
  externalId: z.string().trim().optional().default(''),
  founderName: z.string().trim().optional().default('Resident Founder'),
  email: z.string().trim().optional().default(''),
  phone: z.string().trim().optional().default('Kiritilmagan'),
  telegram: z.string().trim().optional().default(''),
  startupName: z.string().trim().min(1),
  region: z.string().trim().optional().default('Toshkent shahri'),
  description: z.string().trim().optional().default('Manager tomonidan qo‘shilgan rezident.'),
  startupSphere: z.string().trim().optional().default(DEFAULT_STARTUP_SPHERE),
  stage: z.enum(['idea', 'mvp', 'growth', 'scale']).optional().default('mvp'),
  teamSize: z.coerce.number().min(1).optional().default(1),
  mrr: z.coerce.number().min(0).optional().default(0),
  usersCount: z.coerce.number().min(0).optional().default(0),
  investmentRaised: z.coerce.number().min(0).optional().default(0),
  pitchDeck: z.string().trim().optional().default('https://startupgarage.uz'),
  resumeUrl: z.string().trim().optional().default(''),
  residencyDate: z.string().trim().optional().default(''),
  leadStatus: z.string().trim().optional().default(''),
  commitment: z.string().trim().optional().default(''),
});

const importSchema = z.object({
  sheetUrl: z.string().url(),
});

function cleanNumber(value: unknown, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).replace(/[^0-9.-]/g, '');
  if (!normalized) return fallback;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
}

const MONTHS_EN: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

function cleanDate(value: unknown): Date | null {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  // "Year 2025" / "2025" only
  const yearOnly = lower.match(/^(?:year\s+)?(\d{4})$/);
  if (yearOnly) {
    const date = new Date(Number(yearOnly[1]), 0, 1);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  // "January, 2026" / "Jan 2026"
  const monthYear = lower.match(/^([a-z]+)[,\s]+(\d{4})$/);
  if (monthYear && MONTHS_EN[monthYear[1]] !== undefined) {
    const date = new Date(Number(monthYear[2]), MONTHS_EN[monthYear[1]], 1);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  // "October 23, 2024" / "Oct 23 2024" / "October 23rd, 2024"
  const monthDayYear = lower.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})$/);
  if (monthDayYear && MONTHS_EN[monthDayYear[1]] !== undefined) {
    const date = new Date(Number(monthDayYear[3]), MONTHS_EN[monthDayYear[1]], Number(monthDayYear[2]));
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  // Native parser handles ISO and many common formats
  let date = new Date(raw);
  if (!Number.isNaN(date.valueOf())) return date;

  // Uzbek/European formats: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
  const eu = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (eu) {
    const [, dd, mm, yyyy] = eu;
    const year = yyyy.length === 2 ? 2000 + Number(yyyy) : Number(yyyy);
    date = new Date(year, Number(mm) - 1, Number(dd));
    if (!Number.isNaN(date.valueOf())) return date;
  }

  // Excel/Sheets serial number (days since 1899-12-30)
  const serial = Number(raw);
  if (Number.isFinite(serial) && serial > 0 && serial < 100000) {
    date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!Number.isNaN(date.valueOf())) return date;
  }

  return null;
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  // Already a valid URL
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Looks like a domain or path → prefix https://
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function normalizeRegion(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Toshkent shahri';
  const lower = trimmed.toLowerCase().replace(/['‘’`]/g, "'");

  if (/^(toshkent|tashkent)\s*(city|sh|shahar|shahri)$/.test(lower) || lower === 'toshkent' || lower === 'tashkent') {
    return 'Toshkent shahri';
  }
  if (/^(toshkent|tashkent)\s*(viloyat|region)/.test(lower)) return 'Toshkent viloyati';
  if (lower.startsWith('andijon') || lower.startsWith('andijan')) return 'Andijon viloyati';
  if (lower.startsWith("farg") || lower.startsWith('fergana') || lower.startsWith('ferghana')) return "Farg'ona viloyati";
  if (lower.startsWith('namangan')) return 'Namangan viloyati';
  if (lower.startsWith('samarq') || lower.startsWith('samarkand')) return 'Samarqand viloyati';
  if (lower.startsWith('buxoro') || lower.startsWith('bukhara')) return 'Buxoro viloyati';
  if (lower.startsWith('navoi')) return 'Navoiy viloyati';
  if (lower.startsWith('jizzax') || lower.startsWith('jizzakh') || lower.startsWith('jizzak')) return 'Jizzax viloyati';
  if (lower.startsWith('sirdaryo') || lower.startsWith('syrdarya')) return 'Sirdaryo viloyati';
  if (lower.startsWith('qashqadaryo') || lower.startsWith('kashkadar')) return 'Qashqadaryo viloyati';
  if (lower.startsWith('surxondaryo') || lower.startsWith('surkhandar')) return 'Surxondaryo viloyati';
  if (lower.startsWith('xorazm') || lower.startsWith('khorezm') || lower.startsWith('khwarazm')) return 'Xorazm viloyati';
  if (lower.startsWith('qoraqalpog') || lower.startsWith('karakalpak')) return "Qoraqalpog'iston Respublikasi";

  // Otherwise return original (may be a custom region name)
  return trimmed;
}

async function runInChunks<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += size) {
    const chunk = items.slice(index, index + size);
    results.push(...await Promise.all(chunk.map(worker)));
  }
  return results;
}

const HEADER_ALIASES: Record<string, string> = {
  foundername: 'founderName',
  founder: 'founderName',
  asoschi: 'founderName',
  asoschisi: 'founderName',
  name: 'founderName',
  fullname: 'founderName',
  id: 'externalId',
  email: 'email',
  gmail: 'email',
  mail: 'email',
  phone: 'phone',
  telefon: 'phone',
  tel: 'phone',
  telegram: 'telegram',
  tg: 'telegram',
  startupname: 'startupName',
  startup: 'startupName',
  startupnomi: 'startupName',
  project: 'startupName',
  loyiha: 'startupName',
  region: 'region',
  hudud: 'region',
  viloyat: 'region',
  description: 'description',
  tavsif: 'description',
  startuphaqida: 'description',
  categoryarr: 'startupSphere',
  category_arr: 'startupSphere',
  category: 'startupSphere',
  segment: 'startupSphere',
  sphere: 'startupSphere',
  startupsphere: 'startupSphere',
  soha: 'startupSphere',
  industry: 'startupSphere',
  stage: 'stage',
  bosqich: 'stage',
  teamsize: 'teamSize',
  team_size: 'teamSize',
  jamoa: 'teamSize',
  mrr: 'mrr',
  users: 'usersCount',
  userscount: 'usersCount',
  foydalanuvchilar: 'usersCount',
  investment: 'investmentRaised',
  investmentraised: 'investmentRaised',
  fundraised: 'investmentRaised',
  investitsiya: 'investmentRaised',
  pitchdeck: 'pitchDeck',
  pitchdeckurl: 'pitchDeck',
  pitchdecklink: 'pitchDeck',
  pitch: 'pitchDeck',
  pitchurl: 'pitchDeck',
  pitchlink: 'pitchDeck',
  deck: 'pitchDeck',
  deckurl: 'pitchDeck',
  decklink: 'pitchDeck',
  presentation: 'pitchDeck',
  prezentatsiya: 'pitchDeck',
  resume: 'resumeUrl',
  resumeurl: 'resumeUrl',
  residencydate: 'residencyDate',
  residency_date: 'residencyDate',
  joined: 'residencyDate',
  joindate: 'residencyDate',
  joined_date: 'residencyDate',
  qoshilgan: 'residencyDate',
  qoshilgansana: 'residencyDate',
  date: 'residencyDate',
  sana: 'residencyDate',
  createdat: 'residencyDate',
  created_at: 'residencyDate',
  status: 'leadStatus',
  leadstatus: 'leadStatus',
  lead_status: 'leadStatus',
  priority: 'leadStatus',
  holat: 'leadStatus',
};

const VALID_LEAD_STATUSES = ['High', 'Medium', 'Low', 'On Hold', 'Dead', 'Stopped'] as const;

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9а-яёғқўҳ]/gi, '');
}

function splitFounder(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    name: parts[0] || 'Resident',
    surname: parts.slice(1).join(' ') || 'Founder',
  };
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizeStage(value?: string): 'idea' | 'mvp' | 'growth' | 'scale' {
  const stage = String(value || '').toLowerCase();
  if (['idea', 'mvp', 'growth', 'scale'].includes(stage)) return stage as any;
  if (stage.includes('scale')) return 'scale';
  if (stage.includes('growth') || stage.includes('o‘s') || stage.includes("o's")) return 'growth';
  if (stage.includes('idea') || stage.includes('g‘oya') || stage.includes("g'oya")) return 'idea';
  return 'mvp';
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function sheetCsvUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (!url.hostname.includes('docs.google.com')) return rawUrl;
  const id = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
  if (!id) return rawUrl;
  const gid = url.hash.match(/gid=(\d+)/)?.[1] || url.searchParams.get('gid') || '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function parseContactCell(value: string): { phone: string; telegram: string } {
  // Handles "phone | @user", "phone - @user", "@user", "phone", "phone, @user"
  const trimmed = (value || '').trim();
  if (!trimmed) return { phone: '', telegram: '' };
  const parts = trimmed.split(/[|;,/]+|\s-\s/).map((p) => p.trim()).filter(Boolean);
  let phone = '';
  let telegram = '';
  for (const part of parts) {
    if (part.startsWith('@')) {
      if (!telegram) telegram = part;
    } else if (/\+?\d/.test(part)) {
      if (!phone) phone = part;
    }
  }
  // Fallback: single token without separator
  if (!phone && !telegram) {
    if (trimmed.startsWith('@')) telegram = trimmed;
    else phone = trimmed;
  }
  return { phone, telegram };
}

function rowToResident(headers: string[], row: string[]) {
  const payload: Record<string, string> = {};
  // First match wins so an earlier "status" column isn't overwritten by a later column with a similar header
  headers.forEach((header, index) => {
    const mapped = HEADER_ALIASES[normalizeKey(header)];
    if (mapped && !payload[mapped]) payload[mapped] = row[index] || '';
  });

  // Positional fallbacks for the existing Startup Garage resident sheet layout:
  // id,startup,status,region,category_arr,tracker,description,segment,sphere,stage,founder,phone,team_size,pitchdeck,commitment,mrr,users,fundraised,residency_date,sg_equity,legal_name,contract
  payload.externalId ||= row[0] || '';
  payload.startupName ||= row[1] || '';
  payload.leadStatus ||= row[2] || '';
  payload.region ||= row[3] || '';
  payload.startupSphere ||= row[8] || row[7] || row[4] || '';
  payload.description ||= row[6] || '';
  payload.founderName ||= row[10] || '';
  payload.stage ||= row[9] || '';

  // col 11 may contain phone, @telegram, or "phone | @telegram"
  const contact = parseContactCell(row[11] || '');
  payload.phone ||= contact.phone;
  payload.telegram ||= contact.telegram;

  payload.teamSize ||= row[12] || '';
  payload.pitchDeck ||= row[13] || '';
  payload.commitment ||= row[14] || '';
  payload.mrr ||= row[15] || '';
  payload.usersCount ||= row[16] || '';
  payload.investmentRaised ||= row[17] || '';
  payload.residencyDate ||= row[18] || '';

  return payload;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeLeadStatus(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (['high', 'h', 'yuqori'].includes(lower))                        return 'High';
  if (['medium', 'med', 'm', 'orta', 'o\'rta', 'o‘rta'].includes(lower)) return 'Medium';
  if (['low', 'l', 'past'].includes(lower))                            return 'Low';
  if (['dead', 'died', 'lost', 'o‘lik', 'o\'lik'].includes(lower))     return 'Dead';
  if (['on hold', 'onhold', 'hold', 'pause', 'paused', 'kutmoqda'].includes(lower)) return 'On Hold';
  if (['stopped', 'stop', 'to‘xtatilgan', 'to\'xtatilgan', 'tugatilgan'].includes(lower)) return 'Stopped';
  // Unknown / unrelated values (founder names from "tracker" col, etc.) → empty
  return '';
}

function mappedHeaderCount(row: string[]) {
  return row.reduce((count, cell) => count + (HEADER_ALIASES[normalizeKey(cell)] ? 1 : 0), 0);
}

async function upsertResident(input: unknown, actorId: string) {
  try {
    const raw = input as Record<string, unknown>;
    const normalizedInput = {
      ...raw,
      stage: normalizeStage(String(raw.stage || '')),
      teamSize: Math.max(1, cleanNumber(raw.teamSize, 1)),
      mrr: cleanNumber(raw.mrr, 0),
      usersCount: cleanNumber(raw.usersCount, 0),
      investmentRaised: cleanNumber(raw.investmentRaised, 0),
    };

    const parsed = residentSchema.safeParse(normalizedInput);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || 'Invalid row', input };
    }

    const data = parsed.data;
    const founder = splitFounder(data.founderName);
    const startupSphere = STARTUP_SPHERES.includes(data.startupSphere as any)
      ? data.startupSphere
      : DEFAULT_STARTUP_SPHERE;
    const leadStatus = normalizeLeadStatus(data.leadStatus);
    const region = normalizeRegion(data.region);

    // Dedup priority: real email → existing startup by name → generated email
    const realEmail = (data.email || '').toLowerCase().trim();
    const startupNameTrimmed = data.startupName.trim();

    let existingStartup = realEmail
      ? await Startup.findOne({ gmail: realEmail })
      : null;
    if (!existingStartup) {
      existingStartup = await Startup.findOne({
        startup_name: { $regex: `^${escapeRegex(startupNameTrimmed)}$`, $options: 'i' },
        deletedAt: null,
      });
    }

    const email = realEmail
      || (existingStartup?.gmail)
      || `resident-${slug(startupNameTrimmed || data.founderName || data.externalId)}@startupgarage.local`;

    // Reuse existing user when we matched by startup_name to keep the user-startup link stable
    let user = existingStartup?.userId
      ? await User.findById(existingStartup.userId)
      : null;

    if (!user) {
      user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            name: founder.name,
            surname: founder.surname,
            email,
            role: 'user',
          },
          $set: { deletedAt: null, status: 'active' },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }

    if (!existingStartup) {
      existingStartup = await Startup.findOne({ userId: user._id });
    }

    const sheetDate = cleanDate(data.residencyDate);
    const acceptedAt = sheetDate ?? existingStartup?.acceptedAt ?? new Date();

    // Sheet's leadStatus drives system status: Dead / On Hold / Stopped → inactive, otherwise active.
    const systemStatus: 'active' | 'inactive' = ['Dead', 'On Hold', 'Stopped'].includes(leadStatus) ? 'inactive' : 'active';

    const commitmentLower = (data.commitment || '').toLowerCase();
    const commitment: 'full-time' | 'part-time' = commitmentLower.includes('part') ? 'part-time' : 'full-time';

    const startupPayload: Record<string, unknown> = {
      userId: user._id,
      applicationType: 'existing_resident',
      name: founder.name,
      surname: founder.surname,
      gmail: email,
      startup_name: data.startupName,
      region,
      startup_logo: '',
      description: data.description,
      startup_sphere: startupSphere,
      stage: normalizeStage(data.stage),
      founder_name: data.founderName,
      phone: data.phone || 'Kiritilmagan',
      telegram: data.telegram || '@not_provided',
      team_size: data.teamSize,
      pitch_deck: normalizeUrl(data.pitchDeck) || existingStartup?.pitch_deck || 'https://startupgarage.uz',
      resume_url: data.resumeUrl || '',
      applicationAnswers: [],
      commitment,
      mrr: data.mrr,
      users_count: data.usersCount,
      investment_raised: data.investmentRaised,
      status: systemStatus,
      leadStatus: leadStatus
        || (VALID_LEAD_STATUSES.includes(existingStartup?.leadStatus as any)
              ? existingStartup?.leadStatus
              : ''),
      rejectionReason: '',
      rejectedAt: undefined,
      managerId: actorId,
      acceptedAt,
      deletedAt: null,
    };

    const filter = existingStartup ? { _id: existingStartup._id } : { userId: user._id };

    const startup = await Startup.findOneAndUpdate(
      filter,
      {
        $set: startupPayload,
        $push: {
          statusHistory: {
            from: existingStartup?.status,
            to: systemStatus,
            reason: leadStatus
              ? `Sheetdan import (${leadStatus})`
              : 'Manager panel orqali resident qo‘shildi',
            actorId,
            changedAt: new Date(),
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return {
      ok: true,
      created: !existingStartup,
      startupId: startup._id,
      startupName: startup.startup_name,
      leadStatus,
      email,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Row import failed',
      input,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const actor = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();

    const result = await upsertResident(body, actor.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    await AuditLog.create({
      actorId: actor.id,
      action: 'resident_manual_upsert',
      entityType: 'Startup',
      entityId: result.startupId,
      metadata: { email: result.email, startupName: result.startupName },
    });

    return NextResponse.json({ resident: result }, { status: result.created ? 201 : 200 });
  } catch (err) {
    console.error('[POST /api/residents]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const actor = session.user as { id: string; role: string };
    if (!['manager', 'super_admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = importSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Google Sheet link noto‘g‘ri' }, { status: 400 });

    const res = await fetch(sheetCsvUrl(parsed.data.sheetUrl), { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Google Sheet o‘qib bo‘lmadi. Link public yoki CSV exportga ochiq bo‘lishi kerak.' }, { status: 400 });
    }

    const csv = await res.text();
    const rows = parseCsv(csv);
    const headerIndex = rows
      .slice(0, 10)
      .map((row, index) => ({ index, count: mappedHeaderCount(row) }))
      .sort((a, b) => b.count - a.count)[0]?.index ?? 0;
    const headers = rows[headerIndex] || [];
    const dataRows = rows.slice(headerIndex + 1).filter((row) => row.some(Boolean));

    await connectDB();

    const results = await runInChunks(dataRows, 20, (row) =>
      upsertResident(rowToResident(headers, row), actor.id)
    );

    const created = results.filter((item: any) => item.ok && item.created).length;
    const updated = results.filter((item: any) => item.ok && !item.created).length;
    const failed = results.filter((item: any) => !item.ok);

    const leadStatusCounts = results.reduce<Record<string, number>>((acc, item: any) => {
      if (item.ok && item.leadStatus) acc[item.leadStatus] = (acc[item.leadStatus] || 0) + 1;
      return acc;
    }, {});

    await AuditLog.create({
      actorId: actor.id,
      action: 'resident_sheet_import',
      entityType: 'Startup',
      metadata: { total: dataRows.length, created, updated, failed: failed.length },
    });

    return NextResponse.json({
      summary: {
        total: dataRows.length,
        processed: results.length,
        created,
        updated,
        failed: failed.length,
        headerRow: headerIndex + 1,
        leadStatusCounts,
      },
      failed: failed.slice(0, 20),
    });
  } catch (err) {
    console.error('[PUT /api/residents]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
