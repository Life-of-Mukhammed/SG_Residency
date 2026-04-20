import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export function generateMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
}
