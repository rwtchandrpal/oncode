// Checks backend/seed/blind75-list.json against the totals shown on
// https://neetcode.io/practice/practice/blind75 (read 2026-11-25). Exit code 1 on any mismatch.
// Usage: node seed/tools/check-list.js
const path = require("path");
const list = require(path.join(__dirname, "..", "blind75-list.json")).problems;

const EXPECTED = {
  total: 75,
  difficulty: { Easy: 19, Medium: 49, Hard: 7 },
  topic: {
    "Arrays & Hashing": 8, "Two Pointers": 3, "Sliding Window": 4, "Binary Search": 2, "Linked List": 6,
    Stack: 1, Trees: 11, Tries: 3, Backtracking: 2, "Heap / Priority Queue": 1, Graphs: 6, "Advanced Graphs": 1,
    "1-D Dynamic Programming": 10, "2-D Dynamic Programming": 2, Greedy: 2, Intervals: 5, "Bit Manipulation": 5,
    "Math & Geometry": 3,
  },
};

const count = (key) => list.reduce((acc, p) => ((acc[p[key]] = (acc[p[key]] || 0) + 1), acc), {});
const errors = [];
const compare = (label, got, want) => {
  for (const k of new Set([...Object.keys(got), ...Object.keys(want)])) {
    if (got[k] !== want[k]) errors.push(`${label} "${k}": got ${got[k] || 0}, expected ${want[k] || 0}`);
  }
};

if (list.length !== EXPECTED.total) errors.push(`total: got ${list.length}, expected ${EXPECTED.total}`);
compare("difficulty", count("difficulty"), EXPECTED.difficulty);
compare("topic", count("topic"), EXPECTED.topic);
for (const key of ["slug", "title", "order"]) {
  const seen = new Set();
  for (const p of list) {
    if (seen.has(p[key])) errors.push(`duplicate ${key}: ${p[key]}`);
    seen.add(p[key]);
  }
}
list.forEach((p, i) => {
  if (p.order !== i + 1) errors.push(`order gap at index ${i}: ${p.order}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) errors.push(`bad slug: ${p.slug}`);
});

if (errors.length) {
  console.error(`FAIL (${errors.length})\n` + errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${list.length} problems; difficulty ${JSON.stringify(count("difficulty"))}; ${Object.keys(count("topic")).length} topics match`);
