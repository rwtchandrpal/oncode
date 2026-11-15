const User = require('../models/user');
const Submission = require('../models/submission');

/**
 * Sweeps expired demo sessions and cascades the deletion to all associated submissions.
 * This resolves the MongoDB TTL limitation where storage-level TTL purging bypasses
 * Mongoose cascade hooks.
 */
const cleanupExpiredDemoSessions = async () => {
  try {
    const now = new Date();

    // 1. Find all expired demo users
    const expiredUsers = await User.find({
      isDemo: true,
      expiresAt: { $lt: now }
    }).select('_id');

    const userIds = expiredUsers.map((u) => u._id);

    let deletedSubmissionsCount = 0;
    let deletedUsersCount = 0;

    if (userIds.length > 0) {
      const subResult = await Submission.deleteMany({ userId: { $in: userIds } });
      deletedSubmissionsCount += subResult.deletedCount || 0;

      const userResult = await User.deleteMany({ _id: { $in: userIds } });
      deletedUsersCount += userResult.deletedCount || 0;
    }

    // 2. Also sweep any orphaned demo submissions whose expiresAt has passed
    const orphanedSubResult = await Submission.deleteMany({
      isDemo: true,
      expiresAt: { $lt: now }
    });
    deletedSubmissionsCount += orphanedSubResult.deletedCount || 0;

    if (deletedUsersCount > 0 || deletedSubmissionsCount > 0) {
      console.log(
        `[DemoCleanupWorker] Cleaned ${deletedUsersCount} expired demo user(s) and ${deletedSubmissionsCount} associated submission(s).`
      );
    }
  } catch (error) {
    console.error("[DemoCleanupWorker] Error during demo cleanup sweep:", error.message);
  }
};

/**
 * Initializes the background cleanup worker.
 * Runs an immediate sweep on boot, then repeats every intervalMs (default: 1 hour).
 */
const initDemoCleanupWorker = (intervalMs = 60 * 60 * 1000) => {
  // Initial sweep on server startup
  cleanupExpiredDemoSessions();

  // Periodic recurring sweep
  const timer = setInterval(cleanupExpiredDemoSessions, intervalMs);

  // Allow process to exit cleanly without keeping event loop alive solely for cleanup timer
  if (timer.unref) {
    timer.unref();
  }

  return timer;
};

module.exports = {
  cleanupExpiredDemoSessions,
  initDemoCleanupWorker
};
