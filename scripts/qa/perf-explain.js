// Read-only explain() of the hot queries on the LOCAL QA DB (or any MONGO_URI you pass; nothing is written).
const path = require("path");
const mongoose = require(path.join(__dirname, "..", "..", "backend", "node_modules", "mongoose"));
const URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018/oncode_test?directConnection=true";
(async () => {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const P = db.collection("problems"), S = db.collection("submissions"), U = db.collection("users");
  const user = await U.findOne({ email: "user@qa.oncode.test" });
  const prob = await P.findOne({ slug: "two-sum" }, { projection: { _id: 1 } });
  const summarize = (name, ex) => {
    const s = ex.executionStats; const plan = JSON.stringify(ex.queryPlanner.winningPlan);
    const stages = [...new Set(plan.match(/"stage":"[A-Z_]+"/g).map((x) => x.slice(9, -1)))].join(">");
    console.log(`${name.padEnd(46)} ${stages.padEnd(40)} keys=${s.totalKeysExamined} docs=${s.totalDocsExamined} returned=${s.nReturned} ${s.executionTimeMillis}ms`);
  };
  const ex = (cur) => cur.explain("executionStats");
  const proj = { _id: 1, number: 1, slug: 1, title: 1, difficulty: 1, topics: 1 };
  summarize("list page 1 (sort number, limit 20)", await ex(P.find({}).project(proj).sort({ number: 1 }).limit(20)));
  summarize("list page 4 (skip 60)", await ex(P.find({}).project(proj).sort({ number: 1 }).skip(60).limit(20)));
  summarize("list difficulty=Medium", await ex(P.find({ difficulty: "Medium" }).project(proj).sort({ number: 1 }).limit(20)));
  summarize("list search /sum/i", await ex(P.find({ title: { $regex: "sum", $options: "i" } }).project(proj).sort({ number: 1 }).limit(20)));
  summarize("list topic /^trees$/i", await ex(P.find({ topics: { $in: [/^trees$/i] } }).project(proj).sort({ number: 1 }).limit(20)));
  summarize("problem by slug", await ex(P.find({ slug: "two-sum" }).limit(1)));
  summarize("submissions history (user, problem)", await ex(S.find({ userId: user._id, problemId: prob._id }).sort({ createdAt: -1 }).limit(20)));
  summarize("submission count (user, graded)", await ex(S.find({ userId: user._id, status: { $nin: ["Pending", "System Error"] } })));
  summarize("dashboard count graded", await ex(S.find({ status: { $nin: ["Pending", "System Error"] } })));
  summarize("guest history", await ex(db.collection("guestsubmissions").find({ guestId: "x", problemId: prob._id, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(20)));
  summarize("login by email", await ex(U.find({ email: "user@qa.oncode.test" })));
  const sizes = await P.aggregate([{ $project: { s: { $bsonSize: "$$ROOT" }, h: { $bsonSize: { $ifNull: [{ $arrayToObject: [[["h", "$hiddenTestCases"]]] }, {}] } } } }, { $group: { _id: null, avg: { $avg: "$s" }, max: { $max: "$s" }, total: { $sum: "$s" }, maxHidden: { $max: "$h" } } }]).toArray();
  console.log("problem doc size: avg", Math.round(sizes[0].avg / 1024), "KB, max", Math.round(sizes[0].max / 1024), "KB, total", Math.round(sizes[0].total / 1024), "KB; largest hiddenTestCases", Math.round(sizes[0].maxHidden / 1024), "KB");
  const st = await db.command({ dbStats: 1, scale: 1024 * 1024 });
  console.log("dbStats MB: data", st.dataSize.toFixed(1), "storage", st.storageSize.toFixed(1), "indexes", st.indexSize.toFixed(2));
  await mongoose.disconnect();
})();
