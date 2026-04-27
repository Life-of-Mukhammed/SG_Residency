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

function buildKeyboard(role: 'user' | 'manager' | 'super_admin') {
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

async function sendWelcome(user: any, chatId: string | number) {
  const role = user.role as 'user' | 'manager' | 'super_admin';
  const roleLabel =
    role === 'super_admin' ? '⚡ Super Admin' : role === 'manager' ? '🛠 Manager' : '🚀 Founder';

  const commands =
    role === 'user'
      ? '• /me — your startup profile\n• /meetings — your meetings\n• /support — contact support\n• /help — show this menu'
      : '• /me — your profile & next meeting\n• /meetings — your meetings\n• /stats — residency statistics\n• /reports — pending reports\n• /founders — telegram connection status\n• /event &lt;text&gt; — broadcast to all founders\n• /support — contact support\n• /help — show this menu';

  const text =
    `🎉 <b>Welcome to Startup Garage Bot!</b>\n\n` +
    `You're connected as ${roleLabel}.\n\n` +
    `<b>Available commands:</b>\n${commands}\n\n` +
    `🌐 <a href="${DASHBOARD}/dashboard">Open Dashboard</a>`;

  await sendTelegram(chatId, text, { reply_markup: buildKeyboard(role) });
}

async function handleCommand(user: any, chatId: string | number, text: string) {
  const match = text.match(/\/([a-z_]+)/i);
  const command = match ? `/${match[1].toLowerCase()}` : '';

  if (command === '/help' || command === '/menu' || command === '/start') {
    await sendWelcome(user, chatId);
    return;
  }

  if (command === '/support') {
    await sendTelegram(
      chatId,
      `💬 <b>Support</b>\n\n` +
      `For any questions or issues, contact the Startup Garage team directly on Telegram:\n\n` +
      `👤 <a href="https://t.me/${SUPPORT.replace('@', '')}">${SUPPORT}</a>\n\n` +
      `⏰ Response time: usually within a few hours.`,
      { reply_markup: buildKeyboard(user.role) }
    );
    return;
  }

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
      const st = startup?.status ?? null;

      const text =
        `👤 <b>${u.name} ${u.surname || ''}</b>\n` +
        `${'─'.repeat(28)}\n` +
        `📧 Email: ${u.email}\n` +
        `🤖 Telegram: connected ✅\n` +
        (startup
          ? `\n🚀 <b>${startup.startup_name}</b>\n` +
            `Status: ${statusEmoji[st] ?? '•'} ${st}\n` +
            (startup.region ? `Region: 📍 ${startup.region}\n` : '') +
            (startup.stage ? `Stage: ${startup.stage}\n` : '')
          : '\n📋 No startup application yet.\n') +
        `\n` +
        (upcomingMeeting
          ? `🗓 <b>Next meeting</b>\n` +
            `📌 ${upcomingMeeting.topic || 'Meeting'}\n` +
            `📅 ${new Date(upcomingMeeting.scheduledAt).toLocaleString('en-GB', {
              timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}\n` +
            `🔗 <a href="${upcomingMeeting.meetLink}">Join meeting</a>`
          : '📭 No upcoming meetings.') +
        `\n\n✏️ <a href="${DASHBOARD}/dashboard/settings">Edit profile</a>  •  🌐 <a href="${DASHBOARD}/dashboard">Dashboard</a>`;

      await sendTelegram(chatId, text, { reply_markup: buildKeyboard('user') });
      return;
    }

    if (command === '/meetings') {
      const meetings = await Meeting.find({
        userId: user._id,
        status: 'booked',
        scheduledAt: { $gte: new Date() },
      })
        .sort({ scheduledAt: 1 })
        .limit(5)
        .lean();

      const msg =
        meetings.length === 0
          ? `📭 <b>No upcoming meetings</b>\n\nBook one from the dashboard.\n\n🌐 <a href="${DASHBOARD}/dashboard">Open Dashboard</a>`
          : `🗓 <b>Your upcoming meetings</b>\n${'─'.repeat(28)}\n\n` +
            meetings.map((m: any, i) =>
              `${i + 1}. 📌 <b>${m.topic || 'Meeting'}</b>\n` +
              `📅 ${new Date(m.scheduledAt).toLocaleString('en-GB', {
                timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
                day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}\n` +
              `🔗 <a href="${m.meetLink}">Join</a>`
            ).join('\n\n');

      await sendTelegram(chatId, msg, { reply_markup: buildKeyboard('user') });
      return;
    }

    await sendTelegram(
      chatId,
      `❓ Unknown command.\n\nType /help to see available commands.`,
      { reply_markup: buildKeyboard('user') }
    );
    return;
  }

  // Manager / Super Admin commands
  if (command === '/me') {
    const myMeetings = await Meeting.find({
      managerId: user._id,
      status: 'booked',
      scheduledAt: { $gte: new Date() },
    }).sort({ scheduledAt: 1 }).limit(1).lean();

    const roleLabel = user.role === 'super_admin' ? '⚡ Super Admin' : '🛠 Manager';
    const nextM = myMeetings[0] as any;

    const text =
      `👤 <b>${(user as any).name} ${(user as any).surname || ''}</b>\n` +
      `${'─'.repeat(28)}\n` +
      `Role: ${roleLabel}\n` +
      `📧 ${(user as any).email}\n\n` +
      (nextM
        ? `🗓 <b>Next meeting</b>\n` +
          `${new Date(nextM.scheduledAt).toLocaleString('en-GB', {
            timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
            day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}\n📌 ${nextM.topic || 'No topic'}\n🔗 <a href="${nextM.meetLink}">Join</a>`
        : '📭 No upcoming meetings.') +
      `\n\n🌐 <a href="${DASHBOARD}/dashboard">Open Dashboard</a>`;

    await sendTelegram(chatId, text, { reply_markup: buildKeyboard(user.role) });
    return;
  }

  if (command === '/stats') {
    const [total, active, pending, totalR, pendingR, bookedM] = await Promise.all([
      Startup.countDocuments(),
      Startup.countDocuments({ status: 'active' }),
      Startup.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Meeting.countDocuments({ status: 'booked' }),
    ]);

    await sendTelegram(
      chatId,
      `📈 <b>Startup Garage — Stats</b>\n${'─'.repeat(28)}\n\n` +
      `🏢 Startups\n` +
      `  • Total: <b>${total}</b>\n` +
      `  • Active: <b>${active}</b>\n` +
      `  • Pending review: <b>${pending}</b>\n\n` +
      `📋 Reports\n` +
      `  • Total: <b>${totalR}</b>\n` +
      `  • Pending review: <b>${pendingR}</b>\n\n` +
      `🗓 Meetings booked: <b>${bookedM}</b>\n\n` +
      `🌐 <a href="${DASHBOARD}/dashboard">Open Dashboard</a>`,
      { reply_markup: buildKeyboard(user.role) }
    );
    return;
  }

  if (command === '/meetings') {
    const query: Record<string, any> = {
      status: 'booked',
      scheduledAt: { $gte: new Date() },
    };
    if (user.role === 'manager') query.managerId = user._id;

    const meetings = await Meeting.find(query)
      .populate('userId', 'name surname')
      .sort({ scheduledAt: 1 })
      .limit(7)
      .lean();

    const title = user.role === 'manager' ? 'Your upcoming meetings' : 'All upcoming meetings';
    const msg =
      meetings.length === 0
        ? `📭 <b>No upcoming meetings</b>`
        : `🗓 <b>${title}</b>\n${'─'.repeat(28)}\n\n` +
          meetings.map((m: any, i) => {
            const f = m.userId;
            const founder = f?.name ? `${f.name} ${f.surname || ''}`.trim() : 'Founder';
            return (
              `${i + 1}. 👤 <b>${founder}</b>\n` +
              `📌 ${m.topic || 'No topic'}\n` +
              `📅 ${new Date(m.scheduledAt).toLocaleString('en-GB', {
                timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
                day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}\n` +
              `🔗 <a href="${m.meetLink}">Join</a>`
            );
          }).join('\n\n');

    await sendTelegram(chatId, msg, { reply_markup: buildKeyboard(user.role) });
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
        ? `✅ <b>No pending reports</b>`
        : `📋 <b>Pending reports</b>\n${'─'.repeat(28)}\n\n` +
          reports.map((r: any, i) => {
            const name =
              typeof r.startupId === 'object' && r.startupId?.startup_name
                ? r.startupId.startup_name
                : 'Startup';
            return (
              `${i + 1}. <b>${name}</b>\n` +
              `⏰ ${new Date(r.createdAt).toLocaleString('en-GB', {
                timeZone: 'Asia/Tashkent', year: 'numeric', month: 'short',
                day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}`
            );
          }).join('\n\n') +
          `\n\n🌐 <a href="${DASHBOARD}/dashboard/reports">Review Reports</a>`;

    await sendTelegram(chatId, msg, { reply_markup: buildKeyboard(user.role) });
    return;
  }

  if (command === '/founders') {
    const founders = await User.find({ role: 'user' }).select('name surname telegramChatId telegramBotConnectedAt').lean();
    const connected = founders.filter((f: any) => f.telegramChatId);
    const notConnected = founders.filter((f: any) => !f.telegramChatId);

    const connectedList = connected.length === 0
      ? '  (none yet)'
      : connected.map((f: any) =>
          `  ✅ ${f.name} ${f.surname || ''}`.trim()
        ).join('\n');

    const notConnectedList = notConnected.length === 0
      ? '  (all connected!)'
      : notConnected.map((f: any) =>
          `  ⚠️ ${f.name} ${f.surname || ''}`.trim()
        ).join('\n');

    const msg =
      `👥 <b>Founders — Telegram Status</b>\n${'─'.repeat(28)}\n\n` +
      `<b>Connected (${connected.length}/${founders.length})</b>\n${connectedList}\n\n` +
      `<b>Not connected (${notConnected.length})</b>\n${notConnectedList}\n\n` +
      `🌐 <a href="${DASHBOARD}/super-admin">View in Dashboard</a>`;

    await sendTelegram(chatId, msg, { reply_markup: buildKeyboard(user.role) });
    return;
  }

  if (command === '/event') {
    const eventText = text.replace(/^[^\s]*\s+/, '').trim();
    if (!eventText) {
      await sendTelegram(
        chatId,
        `📣 <b>Broadcast to all founders</b>\n\nUsage:\n<code>/event Your message here</code>\n\nThis message will be sent to all connected founders.`,
        { reply_markup: buildKeyboard(user.role) }
      );
      return;
    }

    const founders = await User.find({ role: 'user', telegramChatId: { $exists: true, $ne: '' } })
      .select('telegramChatId')
      .lean();

    const chatIds = founders
      .map((f: any) => f.telegramChatId)
      .filter(Boolean) as string[];

    if (chatIds.length === 0) {
      await sendTelegram(chatId, `📭 No founders have connected Telegram yet.`, { reply_markup: buildKeyboard(user.role) });
      return;
    }

    const senderName = `${(user as any).name || ''} ${(user as any).surname || ''}`.trim() || 'Startup Garage';
    const broadcastMsg =
      `📣 <b>Startup Garage — Announcement</b>\n${'─'.repeat(28)}\n\n` +
      `${eventText}\n\n` +
      `${'─'.repeat(28)}\n` +
      `— ${senderName}\n` +
      `💬 Questions? <a href="https://t.me/${SUPPORT.replace('@', '')}">${SUPPORT}</a>`;

    await sendTelegramToMany(chatIds, broadcastMsg);

    await sendTelegram(
      chatId,
      `✅ <b>Broadcast sent!</b>\n\nYour message was delivered to <b>${chatIds.length}</b> founder(s).`,
      { reply_markup: buildKeyboard(user.role) }
    );
    return;
  }

  await sendTelegram(
    chatId,
    `❓ Unknown command.\n\nType /help to see available commands.`,
    { reply_markup: buildKeyboard(user.role) }
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

    if (connectCode) {
      const userId = connectCode.replace('connect_', '');

      // Remove this chatId from any other account that might have it
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
          `❌ <b>Connection failed</b>\n\nInvalid or expired link. Please generate a new one from the dashboard.\n\n💬 Need help? ${SUPPORT}`
        );
      }
      return NextResponse.json({ ok: true });
    }

    const linkedUser = await User.findOne({ telegramChatId: String(chatId) }).lean();
    if (linkedUser && typeof text === 'string') {
      await handleCommand(linkedUser, String(chatId), text);
    } else if (!linkedUser) {
      await sendTelegram(
        chatId,
        `👋 <b>Hello!</b>\n\nThis bot is for <b>Startup Garage</b> members.\n\nTo connect your account, go to your dashboard settings and scan or click the connect link.\n\n💬 Support: <a href="https://t.me/${SUPPORT.replace('@', '')}">${SUPPORT}</a>`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[POST /api/telegram/webhook]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
