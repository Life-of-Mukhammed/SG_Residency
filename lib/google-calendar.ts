export function isGoogleMeetConfigured() {
  return Boolean(process.env.GOOGLE_MEET_LINK);
}

export async function createGoogleMeetEvent(input: {
  title: string;
  topic?: string;
  scheduledAt: Date;
  duration?: number;
  managerEmail?: string;
  founderEmail?: string;
}) {
  const meetLink = process.env.GOOGLE_MEET_LINK;

  if (!meetLink) {
    throw new Error('Google Meet link is not configured');
  }

  return {
    eventId: `residency-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    meetLink,
  };
}

export async function deleteGoogleMeetEvent(eventId: string) {
  // No-op for static links
}
