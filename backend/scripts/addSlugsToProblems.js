/*
 * One-off migration: gives every problem without a slug a unique one generated from its title
 * ("Two Sum" -> "two-sum", "3Sum" -> "3sum", collisions -> two-sum-2, two-sum-3, ...), so problem
 * pages can live at /problems/<slug>. Problems that already have a slug are never touched, so it is
 * safe to run more than once. Older problems (lower `number`) get the un-suffixed slug first.
 *
 * Safe by default: without --apply it only prints the slugs it WOULD assign.
 *
 *   MONGO_URI="mongodb://..." node scripts/addSlugsToProblems.js            # dry run
 *   MONGO_URI="mongodb://..." node scripts/addSlugsToProblems.js --apply    # update
 *
 * Reads only MONGO_URI from the environment (not backend/.env), so you choose the target explicitly.
 * Only the database host and name are printed, never credentials.
 */
const mongoose = require('mongoose');
const { slugify, isUsable } = require('../src/utils/slug');

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

// Missing, null or empty slug
const NO_SLUG = { $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] };

(async () => {
  await mongoose.connect(uri);
  const problems = mongoose.connection.db.collection('problems');

  const taken = new Set(
    (await problems.find({ slug: { $type: 'string', $ne: '' } }, { projection: { slug: 1 } }).toArray()).map((p) => p.slug)
  );
  const missing = await problems
    .find(NO_SLUG, { projection: { _id: 1, title: 1, number: 1 } })
    .sort({ number: 1, createdAt: 1, _id: 1 })
    .toArray();

  console.log(`Target: ${describeTarget(uri)}`);
  console.log(`Problems with a slug: ${taken.size}; without: ${missing.length}`);

  let updated = 0;
  for (const problem of missing) {
    const base = slugify(problem.title);
    let slug = base;
    for (let n = 2; taken.has(slug) || !isUsable(slug); n++) slug = `${base}-${n}`;
    taken.add(slug);
    console.log(`  #${problem.number ?? '?'} ${JSON.stringify(problem.title)} -> ${slug}`);
    if (apply) {
      // Re-check "no slug" so a concurrent write is never overwritten
      const result = await problems.updateOne({ _id: problem._id, ...NO_SLUG }, { $set: { slug, updatedAt: new Date() } });
      updated += result.modifiedCount;
    }
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to save these slugs.');
  } else {
    console.log(`Added a slug to ${updated} problem(s).`);
  }
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
