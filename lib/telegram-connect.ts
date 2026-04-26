export function buildTelegramConnectCode(userId: string) {
  return `connect_${userId}`;
}

export function parseTelegramConnectCode(text?: string | null) {
  if (!text) return null;
  const match = text.trim().match(/^\/start\s+(connect_[A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}
