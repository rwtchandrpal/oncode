// Database maintenance for replacing the problem set with the seed (see README "Seeding problems").
// Never prints MONGO_URI, REDIS_PASS or any other secret.
//
//   node seed/tools/db.js inspect             read-only: target, collection counts, problem indexes, Redis key counts
//   node seed/tools/db.js backup              read-only: exports every collection to backups/<timestamp>/ (EJSON) and verifies counts
//   node seed/tools/db.js clear --confirmed   deletes problems, submissions and the problemNumber counter;
//                                             resets users.problemsSolved; deletes Redis key topics:v1;
//                                             drops problem indexes the schema no longer defines
//   node seed/tools/db.js check               read-only: verifies the seeded problems (count, slugs, difficulty, snippets, tests)
// Run from backend/.
const path = require("path");
const fs = require("fs");

const BACKEND = path.join(__dirname, "..", "..");
require(path.join(BACKEND, "node_modules", "dotenv")).config({ path: path.join(BACKEND, ".env"), quiet: true });
const mongoose = require(path.join(BACKEND, "node_modules", "mongoose"));
const { BSON } = require(path.join(BACKEND, "node_modules", "mongodb"));
const { createClient } = require(path.join(BACKEND, "node_modules", "redis"));

const mongoTarget = () => {
  const c = mongoose.connection;
  return { host: c.host, db: c.db.databaseName };
};

const connect = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
  await mongoose.connect(process.env.MONGO_URI);
  const t = mongoTarget();
  console.log(`MongoDB: host ${t.host}, database "${t.db}"`);
  return mongoose.connection.db;
};

const redisClient = async () => {
  const client = createClient({
    socket: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) || 6379, connectTimeout: 8000, reconnectStrategy: false },
    password: process.env.REDIS_PASS || undefined,
  });
  client.on("error", () => {});
  await client.connect();
  console.log(`Redis: host ${process.env.REDIS_HOST}`);
  return client;
};

const countKeys = async (client, pattern) => {
  let n = 0;
  for await (const keys of client.scanIterator({ MATCH: pattern, COUNT: 500 })) n += Array.isArray(keys) ? keys.length : 1;
  return n;
};

const collectionCounts = async (db) => {
  const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).sort();
  const counts = {};
  for (const n of names) counts[n] = await db.collection(n).countDocuments();
  return counts;
};

const inspect = async () => {
  const db = await connect();
  const counts = await collectionCounts(db);
  console.log("\nCollections:");
  for (const [n, c] of Object.entries(counts)) console.log(`  ${n.padEnd(20)} ${c}`);
  if (counts.problems !== undefined) {
    const idx = await db.collection("problems").indexes();
    console.log("\nIndexes on problems:");
    for (const i of idx) console.log(`  ${i.name.padEnd(22)} ${JSON.stringify(i.key)}${i.unique ? " unique" : ""}${i.sparse ? " sparse" : ""}`);
  }
  if (counts.counters !== undefined) {
    const docs = await db.collection("counters").find({}).toArray();
    console.log("\nCounters:", docs.map((d) => `${d._id}=${d.seq}`).join(", ") || "(none)");
  }
  if (counts.users !== undefined) {
    const users = await db.collection("users").find({}, { projection: { role: 1, isDemo: 1, problemsSolved: 1 } }).toArray();
    console.log("\nUsers:", users.map((u) => `${u.role}${u.isDemo ? " (demo)" : ""} solved=${(u.problemsSolved || []).length}`).join("; "));
  }
  const userFields = new Set();
  for (const u of await db.collection("users").find({}).toArray()) Object.keys(u).forEach((k) => userFields.add(k));
  console.log("User document fields:", [...userFields].filter((k) => k !== "password").join(", "), "(+ password)");
  try {
    const r = await redisClient();
    console.log("\nRedis key counts by app prefix:");
    for (const p of ["topics:*", "token:*", "rl:*", "demo_runs:*", "demo_ai:*"]) console.log(`  ${p.padEnd(14)} ${await countKeys(r, p)}`);
    console.log(`  (all keys)     ${await r.dbSize()}`);
    await r.quit();
  } catch (e) {
    console.log(`\nRedis: not reachable (${e.code || e.message})`);
  }
};

const backup = async () => {
  const db = await connect();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(BACKEND, "backups", stamp);
  fs.mkdirSync(dir, { recursive: true });
  const counts = await collectionCounts(db);
  const manifest = { createdAt: new Date().toISOString(), target: mongoTarget(), format: "MongoDB Extended JSON v2 (canonical), one array per file", collections: {} };
  for (const name of Object.keys(counts)) {
    const docs = await db.collection(name).find({}).toArray();
    const file = path.join(dir, `${name}.json`);
    fs.writeFileSync(file, BSON.EJSON.stringify(docs, null, 0, { relaxed: false }));
    // verify: re-read and compare count and ids
    const back = BSON.EJSON.parse(fs.readFileSync(file, "utf8"), { relaxed: false });
    const ok = back.length === docs.length && back.every((d, i) => String(d._id) === String(docs[i]._id));
    manifest.collections[name] = { count: docs.length, file: `${name}.json`, bytes: fs.statSync(file).size, verified: ok };
    console.log(`  ${name.padEnd(20)} ${String(docs.length).padStart(6)} docs  ${ok ? "verified" : "MISMATCH"}`);
    if (!ok) throw new Error(`backup verification failed for ${name}`);
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nBackup written to backend/backups/${stamp}/`);
};

const clear = async () => {
  if (!process.argv.includes("--confirmed")) throw new Error("clear deletes data: pass --confirmed");
  const db = await connect();
  const Problem = require(path.join(BACKEND, "src", "models", "problem"));
  const before = await collectionCounts(db);
  const delProblems = await db.collection("problems").deleteMany({});
  const delSubs = await db.collection("submissions").deleteMany({});
  const delCounter = await db.collection("counters").deleteOne({ _id: "problemNumber" });
  const users = await db.collection("users").updateMany({}, { $set: { problemsSolved: [] } });
  console.log(`Deleted problems: ${delProblems.deletedCount} (of ${before.problems})`);
  console.log(`Deleted submissions: ${delSubs.deletedCount} (of ${before.submissions})`);
  console.log(`Deleted counters._id="problemNumber": ${delCounter.deletedCount}`);
  console.log(`users: problemsSolved set to [] on ${users.modifiedCount} of ${users.matchedCount} documents`);
  // Drop problem indexes the current schema does not define, then build the schema's indexes.
  const wanted = new Set(["_id_", ...Problem.schema.indexes().map(([key]) => Object.keys(key).map((k) => `${k}_${key[k]}`).join("_"))]);
  for (const i of await db.collection("problems").indexes()) {
    if (!wanted.has(i.name)) {
      await db.collection("problems").dropIndex(i.name);
      console.log(`Dropped stale index problems.${i.name}`);
    }
  }
  await Problem.syncIndexes();
  console.log("Problem indexes now:", (await db.collection("problems").indexes()).map((i) => i.name).join(", "));
  try {
    const r = await redisClient();
    console.log(`Redis: deleted topics:v1 -> ${await r.del("topics:v1")} key(s)`);
    await r.quit();
  } catch (e) {
    console.log(`Redis: not reachable (${e.code || e.message}); topics:v1 expires on its own within an hour`);
  }
};

const check = async () => {
  const db = await connect();
  const Problem = require(path.join(BACKEND, "src", "models", "problem"));
  const docs = await Problem.find({}).lean();
  const errors = [];
  const slugs = new Set();
  const diff = { Easy: 0, Medium: 0, Hard: 0 };
  for (const d of docs) {
    if (!d.slug) errors.push(`${d.title}: no slug`);
    else if (slugs.has(d.slug)) errors.push(`duplicate slug ${d.slug}`);
    slugs.add(d.slug);
    diff[d.difficulty]++;
    for (const lang of ["cpp", "java"]) {
      const s = (d.codeSnippets || []).find((x) => x.language === lang);
      if (!s || !s.userSnippet || !s.driverCode || !s.driverCode.includes("{{USER_CODE}}")) errors.push(`${d.slug}: missing ${lang} starter/driver`);
      if (!(d.referenceSolutions || []).some((x) => x.language === lang)) errors.push(`${d.slug}: missing ${lang} reference`);
    }
    const n = (d.hiddenTestCases || []).length;
    if (n < 1 || n > 10) errors.push(`${d.slug}: ${n} test cases`);
    try {
      await Problem.hydrate(d).validate();
    } catch (e) {
      errors.push(`${d.slug}: schema validation: ${e.message}`);
    }
  }
  const numbers = docs.map((d) => d.number).sort((a, b) => a - b);
  console.log(`problems: ${docs.length}; unique slugs: ${slugs.size}; ${JSON.stringify(diff)}; numbers ${numbers[0]}..${numbers[numbers.length - 1]}`);
  console.log(errors.length ? `ERRORS (${errors.length}):\n  ${errors.join("\n  ")}` : "All checks passed.");
  const counts = await collectionCounts(db);
  console.log("Collections:", Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(", "));
  return errors.length ? 1 : 0;
};

const commands = { inspect, backup, clear, check };
const cmd = commands[process.argv[2]];
if (!cmd) {
  console.error(`Usage: node seed/tools/db.js ${Object.keys(commands).join("|")}`);
  process.exit(2);
}
cmd()
  .then(async (code) => {
    await mongoose.disconnect();
    process.exit(code || 0);
  })
  .catch(async (e) => {
    console.error(`Error: ${e.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
