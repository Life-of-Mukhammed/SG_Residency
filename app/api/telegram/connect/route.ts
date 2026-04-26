import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { buildTelegramConnectCode } from '@/lib/telegram-connect';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as { id: string };
  const code = buildTelegramConnectCode(user.id);
  const username = process.env.TELEGRAM_BOT_USERNAME?.replace('@', '') || 'SG_residency_bot';
  const startLink = username ? `https://t.me/${username}?start=${code}` : null;

  return NextResponse.json({
    code,
    startLink,
    botUsername: username ? `@${username}` : null,
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as { id: string };
  await connectDB();
  await User.findByIdAndUpdate(user.id, {
    $unset: { telegramChatId: '', telegramBotConnectedAt: '' },
  });

  return NextResponse.json({ ok: true });
}
