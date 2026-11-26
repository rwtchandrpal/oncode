#!/usr/bin/env node
// Creates the QA accounts in the LOCAL test database (refuses anything that is not 127.0.0.1/localhost),
// then prints the command to seed the 75 problems. Idempotent.
//
//   node scripts/qa/setup-local.js            create/refresh accounts
//   node scripts/qa/setup-local.js --cleanup  delete QA users, their submissions, guest submissions, problems
//                                             created by QA tests (slug qa-*), and QA Redis keys are left to
//                                             `docker rm -f oncode-qa-redis`
const path = require("path");
const BACKEND = path.join(__dirname, "..", "..", "backend");
const mongoose = require(path.join(BACKEND, "node_modules", "mongoose"));
const bcrypt = require(path.join(BACKEND, "node_modules", "bcrypt"));
const { ACCOUNTS } = require("./fixtures");

const URI = process.env.QA_MONGO_URI || "mongodb://127.0.0.1:27018/oncode_test?replicaSet=rs0&directConnection=true";
const host = new URL(URI).hostname;
if (!["127.0.0.1", "localhost"].includes(host)) {
  console.error("Refusing: QA_MONGO_URI must point at a local database.");
  process.exit(1);
}

(async () => {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const users = db.collection("users");
  if (process.argv.includes("--cleanup")) {
    const qa = await users.find({ email: /@qa\.oncode\.test$/ }).project({ _id: 1 }).toArray();
    const ids = qa.map((u) => u._id);
    const subs = await db.collection("submissions").deleteMany({ userId: { $in: ids } });
    const us = await users.deleteMany({ _id: { $in: ids } });
    const gs = await db.collection("guestsubmissions").deleteMany({});
    const ps = await db.collection("problems").deleteMany({ slug: /^qa-/ });
    console.log(`removed ${us.deletedCount} users, ${subs.deletedCount} submissions, ${gs.deletedCount} guest submissions, ${ps.deletedCount} qa problems`);
  } else {
    for (const a of Object.values(ACCOUNTS)) {
      const now = new Date();
      await users.updateOne(
        { email: a.email },
        { $set: { firstName: a.firstName, lastName: "QA", role: a.role, password: await bcrypt.hash(a.password, 10), updatedAt: now }, $setOnInsert: { email: a.email, problemsSolved: [], createdAt: now } },
        { upsert: true }
      );
      console.log(`ok ${a.role.padEnd(5)} ${a.email}`);
    }
    console.log(`\nSeed problems:  cd backend && MONGO_URI="${URI}" node seed/seed.js --creator ${ACCOUNTS.admin.email} --yes`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
