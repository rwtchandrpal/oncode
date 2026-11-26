// Seeds the verified Blind 75 problems into MongoDB, upserting by slug.
//
//   node seed/seed.js --dry-run                         offline: checks every file, connects to nothing
//   node seed/seed.js --dry-run --connect --creator <admin email>
//                                                       also reads the database and reports insert/update
//   node seed/seed.js --creator <admin email> --yes     writes (inserts new problems, updates existing ones)
//   ... --only <slug>[,<slug>...]                       limit to some problems
//
// Safety: refuses any problem whose problems/<slug>.json does not match the sha256 recorded in
// verified.json by verify.js; validates every document against the Problem model before writing;
// writes nothing without --yes. MONGO_URI is read from backend/.env (never printed).
// Run from backend/.
const path = require("path");
const fs = require("fs");

const BACKEND = path.join(__dirname, "..");
require(path.join(BACKEND, "node_modules", "dotenv")).config({ path: path.join(BACKEND, ".env"), quiet: true });
const mongoose = require(path.join(BACKEND, "node_modules", "mongoose"));
const P = require("./tools/lib/problems");

// Fields of src/models/problem.js that the seed writes. seedMeta is never stored.
const FIELDS = ["slug", "title", "difficulty", "topics", "description", "constraints", "examples", "visibleTestCase", "hiddenTestCases", "codeSnippets", "referenceSolutions"];

const parseArgs = (argv) => {
  const get = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined);
  return {
    dryRun: argv.includes("--dry-run"),
    connect: argv.includes("--connect"),
    yes: argv.includes("--yes"),
    creator: get("--creator"),
    only: get("--only") ? get("--only").split(",").map((s) => s.trim()).filter(Boolean) : null,
  };
};

const describeTarget = (uri) => {
  try {
    const u = new URL(uri);
    return `${u.protocol}//${u.hostname}${u.pathname || ""}`; // no credentials, no query
  } catch {
    return "(unparseable MONGO_URI)";
  }
};

// Loads, checks the verification hash, and validates one problem. Returns { slug, doc } or { slug, error }.
const prepare = async (slug, verified, Problem) => {
  const file = P.paths.problem(slug);
  if (!fs.existsSync(file)) return { slug, error: "not built" };
  const v = verified[slug];
  if (!v) return { slug, error: "not verified (run verify.js)" };
  if (P.fileHash(file) !== v.sha256) return { slug, error: "file changed since it was verified (re-run verify.js)" };
  const problem = P.readJson(file);
  const doc = Object.fromEntries(FIELDS.map((f) => [f, problem[f]]));
  try {
    await new Problem({ ...doc, problemCreator: new mongoose.Types.ObjectId() }).validate();
  } catch (e) {
    return { slug, error: `schema validation failed: ${e.message}` };
  }
  return { slug, doc };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const Problem = require(path.join(BACKEND, "src", "models", "problem"));
  const User = require(path.join(BACKEND, "src", "models", "user"));
  const hasSlugPath = Boolean(Problem.schema.path("slug"));

  const list = P.loadList();
  const known = new Set(list.map((p) => p.slug));
  const slugs = args.only || list.map((p) => p.slug);
  const unknown = slugs.filter((s) => !known.has(s));
  if (unknown.length) throw new Error(`Unknown slug(s): ${unknown.join(", ")}`);

  const verified = P.readJson(P.paths.verified, {});
  const prepared = [];
  for (const slug of slugs) prepared.push(await prepare(slug, verified, Problem));
  const ready = prepared.filter((p) => p.doc);
  const refused = prepared.filter((p) => p.error);

  console.log(`Problems selected: ${slugs.length}; ready: ${ready.length}; refused: ${refused.length}`);
  for (const r of refused) console.log(`  REFUSED ${r.slug}: ${r.error}`);
  if (!hasSlugPath) console.log("  NOTE: the Problem schema has no 'slug' path; existing problems are matched by title.");

  const offline = args.dryRun && !args.connect;
  if (offline) {
    for (const r of ready) console.log(`  ok      ${r.slug} (${r.doc.hiddenTestCases.length} tests, ${r.doc.difficulty})`);
    console.log("\nDry run (offline): nothing was read from or written to any database.");
    return refused.length ? 1 : 0;
  }

  if (!args.creator) throw new Error("--creator <admin email> is required to read or write the database");
  if (!args.dryRun && !args.yes) throw new Error("Refusing to write without --yes (use --dry-run to preview)");
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set in backend/.env");

  console.log(`\nDatabase: ${describeTarget(process.env.MONGO_URI)}`);
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const admin = await User.findOne({ email: String(args.creator).toLowerCase().trim() }).select("_id role").lean();
    if (!admin) throw new Error(`No user with email ${args.creator}`);
    if (admin.role !== "admin") throw new Error(`User ${args.creator} is not an admin`);

    const counts = { inserted: 0, updated: 0, failed: 0 };
    for (const { slug, doc } of ready) {
      // Match by slug; otherwise adopt an existing problem with the same title that has no slug yet
      // (only before scripts/addSlugsToProblems.js has run; it gives such problems this same slug).
      let existing = hasSlugPath ? await Problem.findOne({ slug }).select("_id title slug").lean() : null;
      if (!existing) {
        const byTitle = await Problem.findOne({ title: doc.title }).select("_id title slug").lean();
        if (byTitle && byTitle.slug && byTitle.slug !== slug) {
          console.log(`  FAILED  ${slug}: title already used by problem with slug ${byTitle.slug}`);
          counts.failed++;
          continue;
        }
        existing = byTitle;
      }
      const action = existing ? "update" : "insert";
      if (args.dryRun) {
        console.log(`  would ${action} ${slug}`);
        counts[action === "insert" ? "inserted" : "updated"]++;
        continue;
      }
      try {
        const fields = hasSlugPath ? doc : Object.fromEntries(Object.entries(doc).filter(([k]) => k !== "slug"));
        if (existing) {
          await Problem.findByIdAndUpdate(existing._id, { $set: fields }, { runValidators: true });
          counts.updated++;
        } else {
          await Problem.create({ ...fields, problemCreator: admin._id });
          counts.inserted++;
        }
        console.log(`  ${action === "insert" ? "inserted" : "updated "} ${slug}`);
      } catch (e) {
        counts.failed++;
        console.log(`  FAILED  ${slug}: ${e.message}`);
      }
    }
    const verb = args.dryRun ? "Would insert" : "Inserted";
    console.log(`\n${verb} ${counts.inserted}, ${args.dryRun ? "would update" : "updated"} ${counts.updated}, failed ${counts.failed}.`);
    if (!args.dryRun) console.log("The topic filter list is cached in Redis for up to an hour; it refreshes on its own.");
    return refused.length || counts.failed ? 1 : 0;
  } finally {
    await mongoose.disconnect();
  }
};

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(`Error: ${e.message}`);
    process.exit(2);
  });
