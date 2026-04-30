import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });

  const user = session.user as { role?: string };
  if (!['manager', 'super_admin'].includes(user.role || '')) {
    return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Faqat PDF, rasm yoki document yuklash mumkin' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fayl hajmi 10MB dan oshmasin' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || '.bin';
  const safeBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 48);
  const filename = `${Date.now()}-${safeBase}${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'gtm-tasks');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({
    file: {
      name: file.name,
      url: `/uploads/gtm-tasks/${filename}`,
      type: file.type,
      size: file.size,
    },
  });
}
