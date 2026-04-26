import Startup from '@/models/Startup';

export async function getUserStartup(userId: string) {
  return Startup.findOne({ userId }).lean();
}

export async function getActiveStartup(userId: string) {
  return Startup.findOne({ userId, status: 'active' }).lean();
}

export async function getMeetingEligibleStartup(userId: string) {
  return Startup.findOne({ userId, status: { $in: ['active', 'lead_accepted'] } }).lean();
}

export async function hasActiveStartup(userId: string) {
  const startup = await getActiveStartup(userId);
  return Boolean(startup);
}
