# Decisions log

Decisions taken while building the Blind 75 seed. The owner's decisions from Phase 0 come first; the rest
were taken unattended (autonomous mode, 2026-11-26) following the repo's conventions.

## Owner decisions (2026-11-25)
1. **Slug**: an optional `slug` field (unique, sparse, kebab-case) was added to `src/models/problem.js` with the
   owner's approval. It is **not committed** (seed commits only include `backend/seed`). `seed.js` upserts by
   slug, and falls back to matching on title if the running schema has no `slug` path.
2. **Samples**: 3 samples in `examples`; sample 1 is `visibleTestCase` (Run); all tests, samples included,
   are `hiddenTestCases` (Submit).
3. **Limits**: kept in `seedMeta.limits` only. The platform sends no per-problem limits, so Judge0's default
   (5 s CPU) applies. `verify.js` flags a reference above 50% of the limit.
4. **Verified gate**: `verified.json` holds the sha256 of each verified problem file; `seed.js` refuses others.
5. **Reference solutions** are seeded into `referenceSolutions` (Solution tab after solving).
6. **Creator**: `seed.js --creator <admin email>`.

## Taken during the build
7. **No platform or schema changes** beyond (1). Everything special (linked lists, trees, graphs, design
   problems, multiple valid answers) is handled inside the driver code and the test input format.
8. **Expected outputs** come from the C++ reference on Judge0 (`build.js`); the Java reference must then
   produce identical output on every test (`verify.js`).
9. **Verification load**: `verify.js` submits one batch at a time. Running all batches in parallel made the
   local Judge0 return "Compilation time limit exceeded" (compiles starved by 5 s TLE runs). Infrastructure
   failures (that message, or Internal Error) are retried once and noted.
10. **O(n^2) cannot be caught for most array problems.** With inputs capped at 200 KB, the largest array is
    about 25,000-35,000 numbers. Measured on batch 1: an O(n^2) Contains Duplicate takes 1.9 s in C++ and
    0.2 s in Java (JIT), both under the 5 s default; naive recursive Climbing Stairs (n=45) times out in C++
    but passes in Java. Catching O(n^2) would need per-problem time limits (a platform change) or inputs
    above 200 KB. Kept as is; slow solutions (`reference/<slug>/slow.*`) are run and their verdicts reported
    so the gap is visible per problem. Large tests are still sized near the cap.
11. **Starter code returns a placeholder** (`return 0;`, `return {};` ...) because C++ is compiled with
    `-Werror=return-type`; an empty non-void body would not compile. The starter is the mandatory negative test:
    it must compile and fail at least one test.
12. **Titles** come from `blind75-list.json` (NeetCode's), only "Bst" fixed to "BST". Topics = the NeetCode
    category, one per problem.
13. **Statements** are written fresh for this platform, with our own sample inputs, not copied from LeetCode
    or NeetCode. Constraints follow the usual LeetCode bounds unless a test needed otherwise (noted per problem).
