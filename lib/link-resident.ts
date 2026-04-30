import mongoose from 'mongoose';
import Startup from '@/models/Startup';
import User from '@/models/User';

/**
 * When a new user signs up (or signs in via Google) using a gmail that was already
 * imported as a resident's contact email, transfer the existing Startup record from
 * its placeholder owner to the freshly registered user.
 *
 * Placeholder users created at import time use the synthetic
 * `resident-...@startupgarage.local` email; they are deleted after re-linking so the
 * real founder owns the resident profile cleanly.
 */
export async function linkResidentByEmail(newUserId: string | mongoose.Types.ObjectId, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const startup = await Startup.findOne({
    gmail: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: 'i' },
    deletedAt: null,
  });
  if (!startup) return null;

  const newUserObjectId = typeof newUserId === 'string'
    ? new mongoose.Types.ObjectId(newUserId)
    : newUserId;

  if (String(startup.userId) === String(newUserObjectId)) return startup;

  const oldUserId = startup.userId;

  // The Startup model has a unique index on `userId`. If the new user already owns
  // a different Startup, the transfer will fail. Resolve by soft-deleting the
  // conflicting record IF it is a fresh self-submitted application (pending +
  // new_applicant). A real, active Startup is left untouched and we abort the link.
  const conflicting = await Startup.findOne({ userId: newUserObjectId, deletedAt: null });
  if (conflicting && String(conflicting._id) !== String(startup._id)) {
    const isAbandonable = conflicting.status === 'pending' && conflicting.applicationType === 'new_applicant';
    if (!isAbandonable) {
      console.warn('[linkResidentByEmail] active conflicting startup, abort link', {
        existing: String(conflicting._id),
        target:   String(startup._id),
        userId:   String(newUserObjectId),
      });
      return null;
    }
    await Startup.findByIdAndUpdate(conflicting._id, {
      $set: { deletedAt: new Date(), status: 'inactive' },
    });
  }

  startup.userId = newUserObjectId;
  startup.gmail = normalizedEmail;
  await startup.save();

  // Remove the placeholder user that was created at import time (no real login data)
  if (oldUserId) {
    const oldUser = await User.findById(oldUserId).select('email password').lean();
    if (oldUser && typeof oldUser.email === 'string' && oldUser.email.endsWith('@startupgarage.local') && !oldUser.password) {
      await User.findByIdAndDelete(oldUserId);
    }
  }

  return startup;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
