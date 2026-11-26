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
14. **Output size counts too**: the 200 KB cap applies to each test's expected output as well as its input
    (Product of Array Except Self and 3Sum large cases were reshaped to keep outputs short).
15. **Java recursion depth.** Probed on this Judge0 (default JVM stack, which the platform cannot change without
    a code change): simple one-argument recursion survives 20,000 levels; a four-way grid DFS overflows at
    10,000 and survives 7,000. Grid tests are therefore capped so the largest connected region is ~4,900 cells
    (Number of Islands 70 x 70 all-land, Pacific Atlantic 60 x 60 flat). A recursive `maxDepth` (two calls
    per level) then overflowed on a 10,000-node chain, so tree chains are capped at 5,000 nodes, below the
    LeetCode bound of 10^4 stated in some problems. `slow-recursive.java` files are the standing checks that a
    plain recursive Java solution passes every test (Number of Islands, Pacific Atlantic, Maximum Depth,
    Maximum Path Sum, Validate BST).
16. **Multiple valid answers** are normalised in the driver (`post` hook): sort (Two Sum indices, Top K, Merge
    Intervals, Pacific Atlantic cells, Word Search II), sort inner and outer lists (3Sum, Group Anagrams,
    Combination Sum). Where the answer cannot be normalised by sorting, the generator makes it unique
    (Top K, Longest Palindromic Substring, Minimum Window Substring, Two Sum) and says so in the statement.
17. **Alien Dictionary** accepts any valid order: the driver checks the returned order against the words
    (every letter once, list sorted under it) and, if valid, prints the alphabetically smallest valid order.
18. **Design problems** (Trie, WordDictionary, MedianFinder) use LeetCode's two-line format (operations,
    arguments); the driver replays them and prints one array of results (`null` for constructor/void).
    Medians are printed with one decimal (they are always multiples of 0.5). See `tools/lib/design.js`.
19. **Round-trip problems** (Serialize/Deserialize, Encode/Decode) call the two methods on **different**
    objects and print the decoded value; Serialize/Deserialize and Clone Graph also reject results that reuse
    the original nodes (deep-copy check in the driver).
20. **Linked List Cycle** keeps `pos` as a driver-only input: the driver links the tail to node `pos` before
    calling `hasCycle(head)`. **Lowest Common Ancestor** reads `p`/`q` as values, looks the nodes up, and prints
    the returned node's value. **Clone Graph** uses a 1-indexed adjacency list and prints the clone's adjacency
    list with each neighbour list sorted.
21. **Meeting Rooms I/II** take `int[][]` intervals instead of NeetCode's `Interval` objects (language-neutral).
22. **seed.js `--dry-run` is offline by default** (no database connection at all), because backend/.env
    points at the production Atlas cluster and the rules forbid touching it. `--dry-run --connect` reads (never
    writes) to report insert/update; real writes need `--creator <admin email> --yes`.
23. **Generator checks are offline-first**: `build.js --check` validates every generated input against the
    problem's constraints and the 200 KB cap without Judge0 (it caught three constraint violations and one
    generator that could never terminate before any Judge0 time was spent).
