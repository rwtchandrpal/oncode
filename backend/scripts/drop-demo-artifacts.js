/*
 * One-off cleanup after the demo account feature was replaced by guest mode
 * (docs/GUEST_MODE_DESIGN.md, section 10).
 *
 * Run it only AFTER the drain: the old TTL indexes on users.expiresAt and submissions.expiresAt keep
 * deleting demo users and demo submissions for up to 24 hours after the last demo session. While any
 * demo document is left, this script reports them and changes nothing. It never deletes users or
 * submissions.
 *
 * Once the drain is complete it:
 *   - drops the two leftover TTL indexes (users.expiresAt_1, submissions.expiresAt_1)
 *   - drops the leftover isDemo_1 indexes
 *   - $unsets isDemo / expiresAt from users and submissions (old documents still carry them)
 *
 * Safe by default: without --apply it only prints what WOULD change.
 *
 *   MONGO_URI="mongodb://..." node scripts/drop-demo-artifacts.js            # dry run
 *   MONGO_URI="mongodb://..." node scripts/drop-demo-artifacts.js --apply    # apply
 *
 * Reads only MONGO_URI from the environment (not backend/.env), so you choose the target explicitly.
 * Only the database host and name are printed, never credentials.
 */
const mongoose = require('mongoose');

const apply = process.argv.slice(2).includes('--apply');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('Set MONGO_URI to the target database first.');
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

const LEGACY_INDEXES = ['expiresAt_1', 'isDemo_1'];
const LEGACY_FIELDS = { isDemo: '', expiresAt: '' };
const hasLegacyFields = { $or: [{ isDemo: { $exists: true } }, { expiresAt: { $exists: true } }] };

(async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`Target: ${describeTarget(uri)}`);

  const collections = ['users', 'submissions'];
  const remainingDemo = {};
  for (const name of collections) {
    remainingDemo[name] = await db.collection(name).countDocuments({ isDemo: true });
  }
  console.log(`Demo documents still present: users=${remainingDemo.users}, submissions=${remainingDemo.submissions}`);

  if (remainingDemo.users > 0 || remainingDemo.submissions > 0) {
    console.log('The TTL drain is not finished (it can take up to 24 h after the last demo session).');
    console.log('Nothing was changed. Run this again later.');
    await mongoose.disconnect();
    return;
  }

  for (const name of collections) {
    const collection = db.collection(name);
    const indexNames = (await collection.indexes()).map((i) => i.name);
    const toDrop = LEGACY_INDEXES.filter((n) => indexNames.includes(n));
    const withFields = await collection.countDocuments(hasLegacyFields);
    console.log(`${name}: legacy indexes ${toDrop.length ? toDrop.join(', ') : '(none)'}; documents with isDemo/expiresAt: ${withFields}`);

    if (apply) {
      for (const indexName of toDrop) {
        await collection.dropIndex(indexName);
        console.log(`  dropped index ${name}.${indexName}`);
      }
      if (withFields > 0) {
        const result = await collection.updateMany(hasLegacyFields, { $unset: LEGACY_FIELDS });
        console.log(`  removed isDemo/expiresAt from ${result.modifiedCount} document(s)`);
      }
    }
  }

  if (!apply) console.log('Dry run only. Re-run with --apply to make these changes.');
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Cleanup failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
