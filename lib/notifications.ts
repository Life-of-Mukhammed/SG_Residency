import Notification from '@/models/Notification';
import User from '@/models/User';

type NotificationType = 'meeting' | 'report' | 'info';

interface NotificationPayload {
  title: string;
  message: string;
  type?: NotificationType;
}

export async function notifyUsers(userIds: string[], payload: NotificationPayload) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return;

  await Notification.insertMany(
    uniqueIds.map((managerId) => ({
      managerId,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? 'info',
    }))
  );
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
