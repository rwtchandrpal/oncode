#!/usr/bin/env node
/*
 * One-off cleanup for BUG-01: marks submissions stuck in 'Pending' (left behind by Judge0 outages
 * before the fix) as 'System Error', so they stop showing as "Pending" in history. Stats already
 * ignore both statuses.
 *
 * Safe by default: without --apply it only prints how many records WOULD change.
 *
 *   MONGO_URI="mongodb://..." node scripts/mark-stale-pending.js                 # dry run
 *   MONGO_URI="mongodb://..." node scripts/mark-stale-pending.js --apply         # update
 *   options: --older-than-minutes=10 (default 10)
 *
 * Reads only MONGO_URI from the environment (not backend/.env), so you choose the target explicitly.
 * Only the database host and name are printed, never credentials.
 */
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const minutesArg = args.find((a) => a.startsWith('--older-than-minutes='));
const olderThanMinutes = minutesArg ? Number(minutesArg.split('=')[1]) : 10;

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('Set MONGO_URI to the target database first.');
  process.exit(1);
}
if (!Number.isFinite(olderThanMinutes) || olderThanMinutes < 1) {
  console.error('--older-than-minutes must be a number >= 1');
  process.exit(1);
}

const describeTarget = (u) => {
  try {
    const parsed = new URL(u);
    return `${parsed.hostname}${parsed.pathname || ''}`;
  } catch {
    return '(unparseable URI)';
  }
};

(async () => {
  await mongoose.connect(uri);
  const submissions = mongoose.connection.db.collection('submissions');
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const filter = { status: 'Pending', createdAt: { $lt: cutoff } };

  const count = await submissions.countDocuments(filter);
  console.log(`Target: ${describeTarget(uri)}`);
  console.log(`Pending submissions older than ${olderThanMinutes} min: ${count}`);

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to mark them as "System Error".');
  } else if (count > 0) {
    const result = await submissions.updateMany(filter, {
      $set: { status: 'System Error', errorMessage: 'Execution service unavailable', updatedAt: new Date() },
    });
    console.log(`Updated ${result.modifiedCount} submission(s) to "System Error".`);
  }
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Cleanup failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
