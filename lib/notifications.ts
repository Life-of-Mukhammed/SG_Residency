import Notification from '@/models/Notification';
import User from '@/models/User';
import { sendNotificationEmail } from '@/lib/mailer';
import { sendTelegramToMany } from '@/lib/telegram';

const EXCLUDED_EMAILS = new Set(
  (process.env.NOTIFICATION_EXCLUDED_EMAILS || 'admin@residency.uz')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

const SUPPORT_HANDLE = '@startupgarage_admin';

type NotificationType = 'meeting' | 'report' | 'info';

interface NotificationPayload {
  title: string;
  message: string;
  type?: NotificationType;
  channels?: {
    inApp?: boolean;
    email?: boolean;
    telegram?: boolean;
  };
  emailUserIds?: string[];
  telegramUserIds?: string[];
}

const TELEGRAM_ICONS: Record<NotificationType, string> = {
  meeting: '🗓',
  report:  '📊',
  info:    '🔔',
};

function buildTelegramText(payload: NotificationPayload): string {
  const icon = TELEGRAM_ICONS[payload.type ?? 'info'];
  const clean = payload.message
    .replace(/<b>(.*?)<\/b>/g, '<b>$1</b>')
    .replace(/<[^>]+>/g, '');

  return (
    `${icon} <b>${payload.title}</b>\n` +
    `${'─'.repeat(28)}\n` +
    `${clean}\n` +
    `${'─'.repeat(28)}\n` +
    `💬 Support: <a href="https://t.me/${SUPPORT_HANDLE.replace('@', '')}">${SUPPORT_HANDLE}</a>\n` +
    `🚀 <a href="${process.env.NEXTAUTH_URL || 'https://residency.startupgarage.uz'}/dashboard">Open Dashboard</a>`
  );
}

export async function notifyUsers(userIds: string[], payload: NotificationPayload) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return;

  if (payload.channels?.inApp !== false) {
    await Notification.insertMany(
      uniqueIds.map((managerId) => ({
        managerId,
        title: payload.title,
        message: payload.message,
        type: payload.type ?? 'info',
      }))
    );
  }

  const recipients = await User.find({ _id: { $in: uniqueIds } })
    .select('email telegramChatId role')
    .lean();

  const allowedRecipients = recipients.filter(
    (user) => !EXCLUDED_EMAILS.has(((user as { email?: string }).email ?? '').toLowerCase())
  );

  const emailRecipientIds = new Set(payload.emailUserIds?.length ? payload.emailUserIds : uniqueIds);
  const telegramRecipientIds = new Set(payload.telegramUserIds?.length ? payload.telegramUserIds : uniqueIds);

  if (payload.channels?.email !== false) {
    await Promise.allSettled(
      allowedRecipients
        .filter((user) => emailRecipientIds.has(String((user as { _id: unknown })._id)))
        .map((user) => (user as { email?: string }).email)
        .filter(Boolean)
        .map((email) =>
          sendNotificationEmail({
            to: String(email),
            subject: payload.title,
            title: payload.title,
            message: payload.message,
            type: payload.type,
          })
        )
    );
  }

  const chatIds =
    payload.channels?.telegram === false
      ? []
      : allowedRecipients
          .filter((user) => telegramRecipientIds.has(String((user as { _id: unknown })._id)))
          .map((user) => (user as { telegramChatId?: string }).telegramChatId)
          .filter(Boolean) as string[];

  if (chatIds.length > 0) {
    await sendTelegramToMany(chatIds, buildTelegramText(payload));
  }
}

export async function notifyRoles(
  roles: Array<'manager' | 'super_admin' | 'user'>,
  payload: NotificationPayload
) {
  const recipients = await User.find({ role: { $in: roles } }).select('_id').lean();
  await notifyUsers(
    recipients.map((user) => String((user as { _id: unknown })._id)),
    payload
  );
}
