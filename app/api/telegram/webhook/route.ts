import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Startup from '@/models/Startup';
import Report from '@/models/Report';
import Meeting from '@/models/Meeting';
import { parseTelegramConnectCode } from '@/lib/telegram-connect';
import { sendTelegram, sendTelegramToMany } from '@/lib/telegram';

const SUPPORT = '@startupgarage_admin';
const DASHBOARD = process.env.NEXTAUTH_URL || 'https://residency.startupgarage.uz';

function mainMenu(role: 'user' | 'manager' | 'super_admin') {
  if (role === 'user') {
    return {
      keyboard: [
        [{ text: '📊 /me' }, { text: '🗓 /meetings' }],
        [{ text: '💬 /support' }, { text: '❓ /help' }],
      ],
      resize_keyboard: true,
    };
  }
  return {
    keyboard: [
      [{ text: '📊 /me' }, { text: '🗓 /meetings' }],
      [{ text: '📈 /stats' }, { text: '📋 /reports' }],
      [{ text: '👥 /founders' }, { text: '📣 /event' }],
      [{ text: '💬 /support' }, { text: '❓ /help' }],
    ],
    resize_keyboard: true,
  };
}

function eventModeMenu() {
  return {
    keyboard: [
      [{ text: '🛑 /event_stop' }],
    ],
    resize_keyboard: true,
  };
}

async function sendWelcome(user: any, chatId: string | number) {
  const role = user.role as 'user' | 'manager' | 'super_admin';
  const roleLabel =
    role === 'super_admin' ? '⚡ Super Admin' :
    role === 'manager' ? '🛠 Menejer' : '🚀 Founder';

  const commands =
    role === 'user'
      ? '• /me — startup profilingiz\n• /meetings — uchrashuvlaringiz\n• /support — yordam so\'rash\n• /help — menyuni ko\'rsatish'
      : '• /me — profilingiz va keyingi uchrashuv\n• /meetings — uchrashuvlar\n• /stats — rezidentlik statistikasi\n• /reports — kutayotgan hisobotlar\n• /founders — telegram ulangan founderlar\n• /event — barcha founderlarga xabar yuborish\n• /support — yordam\n• /help — menyuni ko\'rsatish';

  const text =
    `🎉 <b>Startup Garage Botga xush kelibsiz!</b>\n\n` +
    `Siz <b>${roleLabel}</b> sifatida ulangansiz.\n\n` +
    `<b>Mavjud buyruqlar:</b>\n${commands}\n\n` +
    `🌐 <a href="${DASHBOARD}/dashboard">Dashboardni ochish</a>`;

  await sendTelegram(chatId, text, { reply_markup: mainMenu(role) });
}

async function handleCommand(user: any, chatId: string | number, text: string) {
  const lower = text.trim().toLowerCase();
  const match = text.match(/^\/([a-z_]+)/i);
  const command = match ? `/${match[1].toLowerCase()}` : '';

  // ─── /event_stop or stop button ───────────────────────────────────────────
  if (command === '/event_stop' || lower === '/event_stop') {
    await User.findByIdAndUpdate(user._id, { $set: { telegramState: null } });
    await sendTelegram(
      chatId,
      `✅ <b>E'lon rejimi to'xtatildi.</b>\n\nAsosiy menyuga qaytdingiz.`,
      { reply_markup: mainMenu(user.role) }
    );
    return;
  }

  // ─── Awaiting broadcast message ───────────────────────────────────────────
  if (user.telegramState === 'awaiting_broadcast') {
    await User.findByIdAndUpdate(user._id, { $set: { telegramState: null } });

    const founders = await User.find({ role: 'user', telegramChatId: { $exists: true, $ne: '' } })
      .select('telegramChatId')
      .lean();

    const chatIds = founders.map((f: any) => f.telegramChatId).filter(Boolean) as string[];

    if (chatIds.length === 0) {
      await sendTelegram(
        chatId,
        `📭 <b>Hech bir founder Telegram botni ulamagan.</b>\n\nXabar yuborilmadi.`,
        { reply_markup: mainMenu(user.role) }
      );
      return;
    }

    const senderName = `${(user as any).name || ''} ${(user as any).surname || ''}`.trim() || 'Startup Garage';
    const broadcastMsg =
      `📣 <b>Startup Garage — E'lon</b>\n` +
      `${'━'.repeat(30)}\n\n` +
      `${text}\n\n` +
      `${'━'.repeat(30)}\n` +
      `👤 ${senderName}\n` +
      `💬 Savollar? <a href="https://t.me/${SUPPORT.replace('@', '')}">${SUPPORT}</a>`;

    await sendTelegramToMany(chatIds, broadcastMsg);

    await sendTelegram(
      chatId,
      `✅ <b>E'lon yuborildi!</b>\n\n` +
      `Xabaringiz <b>${chatIds.length}</b> ta founderlarga yetkazildi.\n\n` +
      `📝 Xabar matni:\n<i>${text.length > 200 ? text.slice(0, 200) + '...' : text}</i>`,
      { reply_markup: mainMenu(user.role) }
    );
    return;
  }

  // ─── Standard commands ─────────────────────────────────────────────────────
  if (command === '/help' || command === '/menu' || command === '/start') {
    await sendWelcome(user, chatId);
    return;
  }

  if (command === '/support') {
    await sendTelegram(
      chatId,
      `💬 <b>Yordam</b>\n\n` +
      `Savollar va muammolar bo'yicha Startup Garage jamoasiga Telegram orqali murojaat qiling:\n\n` +
      `👤 <a href="https://t.me/${SUPPORT.replace('@', '')}">${SUPPORT}</a>\n\n` +
      `⏰ Odatda bir necha soat ichida javob beriladi.`,
      { reply_markup: mainMenu(user.role) }
    );
    return;
  }

  // ─── User commands ─────────────────────────────────────────────────────────
  if (user.role === 'user') {
    if (command === '/me') {
      const u = user as any;
      const startup = await Startup.findOne({ userId: u._id }).lean() as any;
      const upcomingMeeting = await Meeting.findOne({
        userId: u._id,
        status: 'booked',
        scheduledAt: { $gte: new Date() },
      }).sort({ scheduledAt: 1 }).lean() as any;

      const statusEmoji: Record<string, string> = {
        active: '✅', pending: '⏳', rejected: '❌', approved: '🎉', lead_accepted: '🟡',
      };
      const statusLabel: Record<string, string> = {
        active: 'Faol', pending: 'Ko\'rib chiqilmoqda', rejected: 'Rad etilgan',
        approved: 'Tasdiqlangan', lead_accepted: 'Intervyu bosqichi',
      };
      const st = startup?.status ?? null;

      const msg =
        `👤 <b>${u.name} ${u.surname || ''}</b>\n` +
        `${'━'.repeat(28)}\n` +
        `📧 Email: ${u.email}\n` +
        `🤖 Telegram: ulangan ✅\n` +
        (startup
          ? `\n🚀 <b>${startup.startup_name}</b>\n` +
            `Holat: ${statusEmoji[st] ?? '•'} ${statusLabel[st] ?? st}\n` +
            (startup.region ? `Hudud: 📍 ${startup.region}\n` : '') +
            (startup.stage ? `Bosqich: ${startup.stage}\n` : '')
          : '\n📋 Hali ariza topshirilmagan.\n') +
        `\n` +
        (upcomingMeeting
          ? `🗓 <b>Keyingi uchrashuv</b>\n` +
            `📌 ${upcomingMeeting.topic || 'Uchrashuv'}\n` +
            `📅 ${new Date(upcomingMeeting.scheduledAt).toLocaleString('ru-RU', {
              timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}\n` +
            `🔗 <a href="${upcomingMeeting.meetLink}">Uchrashuvga kirish</a>`
          : '📭 Kelgusi uchrashuvlar yo\'q.') +
        `\n\n✏️ <a href="${DASHBOARD}/dashboard/settings">Profilni tahrirlash</a>  •  🌐 <a href="${DASHBOARD}/dashboard">Dashboard</a>`;

      await sendTelegram(chatId, msg, { reply_markup: mainMenu('user') });
      return;
    }

    if (command === '/meetings') {
      const meetings = await Meeting.find({
        userId: user._id,
        status: 'booked',
        scheduledAt: { $gte: new Date() },
      }).sort({ scheduledAt: 1 }).limit(5).lean();

      const msg =
        meetings.length === 0
          ? `📭 <b>Kelgusi uchrashuvlar yo'q</b>\n\nDashboarddan bron qiling.\n\n🌐 <a href="${DASHBOARD}/dashboard">Dashboardni ochish</a>`
          : `🗓 <b>Uchrashuvlaringiz</b>\n${'━'.repeat(28)}\n\n` +
            meetings.map((m: any, i) =>
              `${i + 1}. 📌 <b>${m.topic || 'Uchrashuv'}</b>\n` +
              `📅 ${new Date(m.scheduledAt).toLocaleString('ru-RU', {
                timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
                day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}\n` +
              `🔗 <a href="${m.meetLink}">Kirish</a>`
            ).join('\n\n');

      await sendTelegram(chatId, msg, { reply_markup: mainMenu('user') });
      return;
    }

    await sendTelegram(
      chatId,
      `❓ Noma'lum buyruq.\n\nMavjud buyruqlarni ko'rish uchun /help bosing.`,
      { reply_markup: mainMenu('user') }
    );
    return;
  }

  // ─── Manager / Super Admin commands ───────────────────────────────────────
  if (command === '/me') {
    const myMeetings = await Meeting.find({
      managerId: user._id,
      status: 'booked',
      scheduledAt: { $gte: new Date() },
    }).sort({ scheduledAt: 1 }).limit(1).lean();

    const roleLabel = user.role === 'super_admin' ? '⚡ Super Admin' : '🛠 Menejer';
    const nextM = myMeetings[0] as any;

    const msg =
      `👤 <b>${(user as any).name} ${(user as any).surname || ''}</b>\n` +
      `${'━'.repeat(28)}\n` +
      `Rol: ${roleLabel}\n` +
      `📧 ${(user as any).email}\n\n` +
      (nextM
        ? `🗓 <b>Keyingi uchrashuv</b>\n` +
          `${new Date(nextM.scheduledAt).toLocaleString('ru-RU', {
            timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
            day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}\n📌 ${nextM.topic || 'Mavzu yo\'q'}\n🔗 <a href="${nextM.meetLink}">Kirish</a>`
        : '📭 Kelgusi uchrashuvlar yo\'q.') +
      `\n\n🌐 <a href="${DASHBOARD}/manager">Dashboard</a>`;

    await sendTelegram(chatId, msg, { reply_markup: mainMenu(user.role) });
    return;
  }

  if (command === '/stats') {
    const [total, active, pending, leadAccepted, totalR, pendingR, bookedM, totalUsers] = await Promise.all([
      Startup.countDocuments(),
      Startup.countDocuments({ status: 'active' }),
      Startup.countDocuments({ status: 'pending' }),
      Startup.countDocuments({ status: 'lead_accepted' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Meeting.countDocuments({ status: 'booked' }),
      User.countDocuments({ role: 'user' }),
    ]);

    await sendTelegram(
      chatId,
      `📈 <b>Startup Garage — Statistika</b>\n${'━'.repeat(28)}\n\n` +
      `🏢 <b>Startuplar</b>\n` +
      `  • Jami: <b>${total}</b>\n` +
      `  • Faol rezidentlar: <b>${active}</b>\n` +
      `  • Intervyu bosqichi: <b>${leadAccepted}</b>\n` +
      `  • Ko'rib chiqilmoqda: <b>${pending}</b>\n\n` +
      `👥 <b>Founderlar:</b> <b>${totalUsers}</b>\n\n` +
      `📋 <b>Hisobotlar</b>\n` +
      `  • Jami: <b>${totalR}</b>\n` +
      `  • Kutayotgan: <b>${pendingR}</b>\n\n` +
      `🗓 <b>Bron qilingan uchrashuvlar:</b> <b>${bookedM}</b>\n\n` +
      `🌐 <a href="${DASHBOARD}/manager/analytics">To'liq statistika</a>`,
      { reply_markup: mainMenu(user.role) }
    );
    return;
  }

  if (command === '/meetings') {
    const query: Record<string, any> = { status: 'booked', scheduledAt: { $gte: new Date() } };
    if (user.role === 'manager') query.managerId = user._id;

    const meetings = await Meeting.find(query)
      .populate('userId', 'name surname')
      .sort({ scheduledAt: 1 })
      .limit(7)
      .lean();

    const title = user.role === 'manager' ? 'Sizning uchrashuvlaringiz' : 'Barcha uchrashuvlar';
    const msg =
      meetings.length === 0
        ? `📭 <b>Kelgusi uchrashuvlar yo'q</b>`
        : `🗓 <b>${title}</b>\n${'━'.repeat(28)}\n\n` +
          meetings.map((m: any, i) => {
            const f = m.userId;
            const founder = f?.name ? `${f.name} ${f.surname || ''}`.trim() : 'Founder';
            return (
              `${i + 1}. 👤 <b>${founder}</b>\n` +
              `📌 ${m.topic || 'Mavzu yo\'q'}\n` +
              `📅 ${new Date(m.scheduledAt).toLocaleString('ru-RU', {
                timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
                day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}\n` +
              `🔗 <a href="${m.meetLink}">Kirish</a>`
            );
          }).join('\n\n');

    await sendTelegram(chatId, msg, { reply_markup: mainMenu(user.role) });
    return;
  }

  if (command === '/reports') {
    const reports = await Report.find({ status: 'pending' })
      .populate('startupId', 'startup_name')
      .sort({ createdAt: -1 })
      .limit(7)
      .lean();

    const msg =
      reports.length === 0
        ? `✅ <b>Kutayotgan hisobotlar yo'q</b>\n\nHamma hisobotlar ko'rib chiqilgan!`
        : `📋 <b>Kutayotgan hisobotlar</b>\n${'━'.repeat(28)}\n\n` +
          reports.map((r: any, i) => {
            const name =
              typeof r.startupId === 'object' && r.startupId?.startup_name
                ? r.startupId.startup_name
                : 'Startup';
            return (
              `${i + 1}. <b>${name}</b>\n` +
              `⏰ ${new Date(r.createdAt).toLocaleString('ru-RU', {
                timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
                day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}`
            );
          }).join('\n\n') +
          `\n\n🌐 <a href="${DASHBOARD}/manager/reports">Hisobotlarni ko'rish</a>`;

    await sendTelegram(chatId, msg, { reply_markup: mainMenu(user.role) });
    return;
  }

  if (command === '/founders') {
    const founders = await User.find({ role: 'user' }).select('name surname telegramChatId').lean();
    const connected = founders.filter((f: any) => f.telegramChatId);
    const notConnected = founders.filter((f: any) => !f.telegramChatId);

    const connectedList = connected.length === 0
      ? '  (hali hech kim ulamagan)'
      : connected.map((f: any) => `  ✅ ${f.name} ${f.surname || ''}`.trim()).join('\n');

    const notConnectedList = notConnected.length === 0
      ? '  (hammasi ulangan!)'
      : notConnected.map((f: any) => `  ⚠️ ${f.name} ${f.surname || ''}`.trim()).join('\n');

    const msg =
      `👥 <b>Founderlar — Telegram holati</b>\n${'━'.repeat(28)}\n\n` +
      `📊 Jami: <b>${founders.length}</b> | Ulangan: <b>${connected.length}</b> | Ulanmagan: <b>${notConnected.length}</b>\n\n` +
      `<b>✅ Ulangan (${connected.length})</b>\n${connectedList}\n\n` +
      `<b>⚠️ Ulanmagan (${notConnected.length})</b>\n${notConnectedList}\n\n` +
      `🌐 <a href="${DASHBOARD}/super-admin">Dashboardda ko'rish</a>`;

    await sendTelegram(chatId, msg, { reply_markup: mainMenu(user.role) });
    return;
  }

  // ─── /event — interactive broadcast ───────────────────────────────────────
  if (command === '/event') {
    // Check if there's inline text after /event
    const inlineText = text.replace(/^\/event\s*/i, '').trim();

    if (inlineText && inlineText.toLowerCase() !== 'stop') {
      // Direct send: /event Salom hammaga!
      await _broadcastToFounders(user, chatId, inlineText);
      return;
    }

    // Enter interactive mode
    await User.findByIdAndUpdate(user._id, { $set: { telegramState: 'awaiting_broadcast' } });

    const founders = await User.find({ role: 'user', telegramChatId: { $exists: true, $ne: '' } })
      .select('_id').lean();

    await sendTelegram(
      chatId,
      `📣 <b>Hamma founderlarga e'lon yuborish</b>\n${'━'.repeat(30)}\n\n` +
      `👥 Ulangan founderlar: <b>${founders.length}</b> ta\n\n` +
      `✍️ <b>Quyida xabaringizni yozing.</b>\n` +
      `Rasm, matn yoki istalgan formatda yuboring.\n\n` +
      `🛑 Bekor qilish uchun /event_stop bosing.`,
      { reply_markup: eventModeMenu() }
    );
    return;
  }

  await sendTelegram(
    chatId,
    `❓ Noma'lum buyruq.\n\nMavjud buyruqlarni ko'rish uchun /help bosing.`,
    { reply_markup: mainMenu(user.role) }
  );
}

async function _broadcastToFounders(user: any, chatId: string | number, messageText: string) {
  const founders = await User.find({ role: 'user', telegramChatId: { $exists: true, $ne: '' } })
    .select('telegramChatId')
    .lean();

  const chatIds = founders.map((f: any) => f.telegramChatId).filter(Boolean) as string[];

  if (chatIds.length === 0) {
    await sendTelegram(
      chatId,
      `📭 <b>Hech bir founder Telegram botni ulamagan.</b>\n\nXabar yuborilmadi.`,
      { reply_markup: mainMenu(user.role) }
    );
    return;
  }

  const senderName = `${(user as any).name || ''} ${(user as any).surname || ''}`.trim() || 'Startup Garage';
  const broadcastMsg =
    `📣 <b>Startup Garage — E'lon</b>\n` +
    `${'━'.repeat(30)}\n\n` +
    `${messageText}\n\n` +
    `${'━'.repeat(30)}\n` +
    `👤 ${senderName}\n` +
    `💬 Savollar? <a href="https://t.me/${SUPPORT.replace('@', '')}">${SUPPORT}</a>`;

  await sendTelegramToMany(chatIds, broadcastMsg);

  await sendTelegram(
    chatId,
    `✅ <b>E'lon yuborildi!</b>\n\n` +
    `📨 <b>${chatIds.length}</b> ta founderlarga yetkazildi.\n\n` +
    `📝 Xabar:\n<i>${messageText.length > 300 ? messageText.slice(0, 300) + '...' : messageText}</i>`,
    { reply_markup: mainMenu(user.role) }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    const chatId = message?.chat?.id;
    const text = message?.text;
    const connectCode = parseTelegramConnectCode(text);

    if (!chatId) return NextResponse.json({ ok: true });

    await connectDB();

    // ── Connect account ──────────────────────────────────────────────────────
    if (connectCode) {
      const userId = connectCode.replace('connect_', '');

      await User.updateMany(
        { telegramChatId: String(chatId), _id: { $ne: userId } },
        { $unset: { telegramChatId: '', telegramBotConnectedAt: '' } }
      );

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { telegramChatId: String(chatId), telegramBotConnectedAt: new Date() } },
        { new: true }
      ).lean();

      if (user) {
        await sendWelcome(user, String(chatId));
      } else {
        await sendTelegram(
          chatId,
          `❌ <b>Ulanishda xatolik</b>\n\nHavola noto'g'ri yoki muddati o'tgan. Dashboard sozlamalaridan yangisini oling.\n\n💬 Yordam: ${SUPPORT}`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ── Handle commands ───────────────────────────────────────────────────────
    const linkedUser = await User.findOne({ telegramChatId: String(chatId) }).lean();

    if (linkedUser && typeof text === 'string') {
      await handleCommand(linkedUser, String(chatId), text);
    } else if (!linkedUser) {
      await sendTelegram(
        chatId,
        `👋 <b>Salom!</b>\n\nBu bot <b>Startup Garage</b> a'zolari uchun.\n\nAkkauntingizni ulash uchun dashboard sozlamalariga kiring va bog'lash havolasini bosing.\n\n💬 Yordam: <a href="https://t.me/${SUPPORT.replace('@', '')}">${SUPPORT}</a>`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[POST /api/telegram/webhook]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
