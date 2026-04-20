export interface PendingNotification {
  managerId: string;
  title: string;
  message: string;
}

// In-memory queue — survives within a single server process
export const pendingNotifications: PendingNotification[] = [];
