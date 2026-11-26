# Blind 75 seed: final report

Generated 2026-11-26 by `seed/tools/final-report.js` from the verification results on disk.

## Summary

- **VERIFIED: 75** of 75 (Easy 19, Medium 49, Hard 7)
- BLOCKED: 0
- FAILED (built, last verification failed): 0
- BUILT but not verified: 0
- NOT STARTED: 0

Every VERIFIED problem passed, on the local Judge0 through the platform's own `judgeService`: all tests
Accepted for the C++ and the Java reference, identical output from both, and rejection of the starter code
(and of every `wrong*` solution) in both languages. Expected outputs all come from the C++ reference.

## Problems

| # | Problem | Difficulty | Status | C++ ref | Java ref | Negative tests | Slow solutions (informational) |
|---|---|---|---|---|---|---|---|
| 1 | contains-duplicate | Easy | VERIFIED | PASS (22 ms) | PASS (182 ms) | rejected (starter cpp 6/10; starter java 6/10) | slow.cpp: passes; slow.java: passes |
| 2 | valid-anagram | Easy | VERIFIED | PASS (21 ms) | PASS (137 ms) | rejected (starter cpp 4/10; starter java 4/10) | slow.cpp: passes; slow.java: passes |
| 3 | two-sum | Easy | VERIFIED | PASS (30 ms) | PASS (202 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-same-index.cpp 3/10) | slow.cpp: passes; slow.java: passes |
| 4 | group-anagrams | Medium | VERIFIED | PASS (58 ms) | PASS (583 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-letter-set.cpp 4/10) |  |
| 5 | top-k-frequent-elements | Medium | VERIFIED | PASS (39 ms) | PASS (254 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-least.cpp 8/10) |  |
| 6 | encode-and-decode-strings | Medium | VERIFIED | PASS (12 ms) | PASS (156 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-separator.cpp 5/10) |  |
| 7 | product-of-array-except-self | Medium | VERIFIED | PASS (20 ms) | PASS (207 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-division.cpp 4/10) |  |
| 8 | longest-consecutive-sequence | Medium | VERIFIED | PASS (40 ms) | PASS (259 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-duplicates.cpp 2/10) |  |
| 9 | valid-palindrome | Easy | VERIFIED | PASS (23 ms) | PASS (130 ms) | rejected (starter cpp 6/10; starter java 6/10; wrong-no-digits.cpp 1/10) |  |
| 10 | 3sum | Medium | VERIFIED | PASS (47 ms) | PASS (874 ms) | rejected (starter cpp 8/10; starter java 8/10; wrong-duplicates.cpp 5/10) | slow.cpp: caught 3/10 |
| 11 | container-with-most-water | Medium | VERIFIED | PASS (19 ms) | PASS (169 ms) | rejected (starter cpp 9/10; starter java 9/10) | slow.cpp: caught 3/10 |
| 12 | best-time-to-buy-and-sell-stock | Easy | VERIFIED | PASS (23 ms) | PASS (164 ms) | rejected (starter cpp 5/10; starter java 5/10; wrong-min-max.cpp 6/10) | slow.cpp: caught 1/10; slow.java: passes |
| 13 | longest-substring-without-repeating-characters | Medium | VERIFIED | PASS (13 ms) | PASS (234 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-abba.cpp 5/10) |  |
| 14 | longest-repeating-character-replacement | Medium | VERIFIED | PASS (28 ms) | PASS (171 ms) | rejected (starter cpp 10/10; starter java 10/10) |  |
| 15 | minimum-window-substring | Hard | VERIFIED | PASS (22 ms) | PASS (207 ms) | rejected (starter cpp 7/10; starter java 7/10; wrong-ignore-counts.cpp 4/10) |  |
| 16 | find-minimum-in-rotated-sorted-array | Medium | VERIFIED | PASS (18 ms) | PASS (148 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-first.cpp 2/10) |  |
| 17 | search-in-rotated-sorted-array | Medium | VERIFIED | PASS (21 ms) | PASS (155 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-plain-binary.cpp 3/10) |  |
| 18 | reverse-linked-list | Easy | VERIFIED | PASS (13 ms) | PASS (174 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-lost-tail.cpp 9/10) |  |
| 19 | merge-two-sorted-lists | Easy | VERIFIED | PASS (12 ms) | PASS (121 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-drop-rest.cpp 9/10) |  |
| 20 | linked-list-cycle | Easy | VERIFIED | PASS (16 ms) | PASS (169 ms) | rejected (starter cpp 5/10; starter java 5/10; wrong-values.cpp 2/10) |  |
| 21 | reorder-list | Medium | VERIFIED | PASS (25 ms) | PASS (299 ms) | rejected (starter cpp 7/10; starter java 7/10) |  |
| 22 | remove-nth-node-from-end-of-list | Medium | VERIFIED | PASS (10 ms) | PASS (130 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-from-front.cpp 8/10) |  |
| 23 | merge-k-sorted-lists | Hard | VERIFIED | PASS (46 ms) | PASS (293 ms) | rejected (starter cpp 8/10; starter java 8/10; wrong-concat.cpp 6/10) |  |
| 24 | valid-parentheses | Easy | VERIFIED | PASS (17 ms) | PASS (121 ms) | rejected (starter cpp 3/10; starter java 3/10; wrong-counts.cpp 1/10) | slow.cpp: caught 1/10; slow.java: passes |
| 25 | invert-binary-tree | Easy | VERIFIED | PASS (10 ms) | PASS (123 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-root-only.cpp 7/10) |  |
| 26 | maximum-depth-of-binary-tree | Easy | VERIFIED | PASS (27 ms) | PASS (197 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-left-only.cpp 6/10) | slow-recursive.java: passes |
| 27 | same-tree | Easy | VERIFIED | PASS (27 ms) | PASS (141 ms) | rejected (starter cpp 3/10; starter java 3/10; wrong-inorder.cpp 1/10) |  |
| 28 | subtree-of-another-tree | Easy | VERIFIED | PASS (26 ms) | PASS (216 ms) | rejected (starter cpp 5/10; starter java 5/10; wrong-top-only.cpp 1/10) |  |
| 29 | lowest-common-ancestor-of-a-binary-search-tree | Medium | VERIFIED | PASS (27 ms) | PASS (185 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-parent-of-p.cpp 6/10) |  |
| 30 | binary-tree-level-order-traversal | Medium | VERIFIED | PASS (9 ms) | PASS (151 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-right-first.cpp 6/10) |  |
| 31 | validate-binary-search-tree | Medium | VERIFIED | PASS (27 ms) | PASS (234 ms) | rejected (starter cpp 5/10; starter java 5/10; wrong-int-bounds.cpp 2/10; wrong-local.cpp 1/10) | slow-recursive.java: passes |
| 32 | kth-smallest-element-in-a-bst | Medium | VERIFIED | PASS (26 ms) | PASS (216 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-level-order.cpp 7/10) |  |
| 33 | construct-binary-tree-from-preorder-and-inorder-traversal | Medium | VERIFIED | PASS (19 ms) | PASS (164 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-all-left.cpp 7/10) |  |
| 34 | binary-tree-maximum-path-sum | Hard | VERIFIED | PASS (37 ms) | PASS (278 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-through-root.cpp 4/10) | slow-recursive.java: passes |
| 35 | serialize-and-deserialize-binary-tree | Hard | VERIFIED | PASS (95 ms) | PASS (480 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-reuse.cpp 9/10; wrong-values-only.cpp 7/10) |  |
| 36 | implement-trie-prefix-tree | Medium | VERIFIED | PASS (54 ms) | PASS (517 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-no-end-mark.cpp 7/10) |  |
| 37 | design-add-and-search-words-data-structure | Medium | VERIFIED | PASS (51 ms) | PASS (438 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-prefix-match.cpp 7/10) |  |
| 38 | word-search-ii | Hard | VERIFIED | PASS (110 ms) | PASS (1486 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-duplicates.cpp 5/10) |  |
| 39 | combination-sum | Medium | VERIFIED | PASS (26 ms) | PASS (262 ms) | rejected (starter cpp 8/10; starter java 8/10; wrong-use-once.cpp 6/10) |  |
| 40 | word-search | Medium | VERIFIED | PASS (15 ms) | PASS (134 ms) | rejected (starter cpp 4/10; starter java 4/10; wrong-reuse.cpp 2/10) | slow.cpp: passes |
| 41 | find-median-from-data-stream | Hard | VERIFIED | PASS (50 ms) | PASS (250 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-integer-division.cpp 8/10) |  |
| 42 | number-of-islands | Medium | VERIFIED | PASS (13 ms) | PASS (214 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-diagonal.cpp 5/10) | slow-recursive.java: passes |
| 43 | clone-graph | Medium | VERIFIED | PASS (24 ms) | PASS (158 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-shallow.cpp 8/10) |  |
| 44 | pacific-atlantic-water-flow | Medium | VERIFIED | PASS (20 ms) | PASS (325 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-strict.cpp 5/10) | slow-recursive.java: passes |
| 45 | course-schedule | Medium | VERIFIED | PASS (14 ms) | PASS (176 ms) | rejected (starter cpp 6/10; starter java 6/10; wrong-visited-only.cpp 3/10) |  |
| 46 | graph-valid-tree | Medium | VERIFIED | PASS (17 ms) | PASS (182 ms) | rejected (starter cpp 6/10; starter java 6/10; wrong-count-only.cpp 2/10) |  |
| 47 | number-of-connected-components-in-an-undirected-graph | Medium | VERIFIED | PASS (36 ms) | PASS (184 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-n-minus-edges.cpp 4/10) |  |
| 48 | alien-dictionary | Hard | VERIFIED | PASS (14 ms) | PASS (162 ms) | rejected (starter cpp 6/10; starter java 6/10; wrong-no-prefix-check.cpp 2/10) |  |
| 49 | climbing-stairs | Easy | VERIFIED | PASS (19 ms) | PASS (106 ms) | rejected (starter cpp 10/10; starter java 10/10) | slow.cpp: caught 1/10; slow.java: passes |
| 50 | house-robber | Medium | VERIFIED | PASS (21 ms) | PASS (127 ms) | rejected (starter cpp 9/10; starter java 9/10) | slow.cpp: caught 4/10; slow.java: caught 4/10 |
| 51 | house-robber-ii | Medium | VERIFIED | PASS (28 ms) | PASS (151 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-linear.cpp 4/10) |  |
| 52 | longest-palindromic-substring | Medium | VERIFIED | PASS (16 ms) | PASS (181 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-odd-only.cpp 5/10) |  |
| 53 | palindromic-substrings | Medium | VERIFIED | PASS (15 ms) | PASS (203 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-odd-only.cpp 6/10) |  |
| 54 | decode-ways | Medium | VERIFIED | PASS (13 ms) | PASS (97 ms) | rejected (starter cpp 6/10; starter java 6/10; wrong-leading-zero.cpp 3/10) | slow.cpp: caught 1/10 |
| 55 | coin-change | Medium | VERIFIED | PASS (11 ms) | PASS (158 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-greedy.cpp 4/10) | slow.cpp: caught 3/10 |
| 56 | maximum-product-subarray | Medium | VERIFIED | PASS (21 ms) | PASS (163 ms) | rejected (starter cpp 8/10; starter java 8/10; wrong-max-only.cpp 7/10) |  |
| 57 | word-break | Medium | VERIFIED | PASS (29 ms) | PASS (323 ms) | rejected (starter cpp 5/10; starter java 5/10) | slow.cpp: caught 1/10 |
| 58 | longest-increasing-subsequence | Medium | VERIFIED | PASS (21 ms) | PASS (167 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-non-strict.cpp 3/10) |  |
| 59 | unique-paths | Medium | VERIFIED | PASS (11 ms) | PASS (110 ms) | rejected (starter cpp 10/10; starter java 10/10) | slow.cpp: caught 1/10 |
| 60 | longest-common-subsequence | Medium | VERIFIED | PASS (42 ms) | PASS (159 ms) | rejected (starter cpp 9/10; starter java 9/10) | slow.cpp: caught 4/10 |
| 61 | maximum-subarray | Medium | VERIFIED | PASS (18 ms) | PASS (186 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-empty-allowed.cpp 3/10) |  |
| 62 | jump-game | Medium | VERIFIED | PASS (23 ms) | PASS (180 ms) | rejected (starter cpp 6/10; starter java 6/10; wrong-farthest.cpp 1/10) |  |
| 63 | insert-interval | Medium | VERIFIED | PASS (26 ms) | PASS (315 ms) | rejected (starter cpp 10/10; starter java 10/10) |  |
| 64 | merge-intervals | Medium | VERIFIED | PASS (83 ms) | PASS (230 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-strict.cpp 5/10) |  |
| 65 | non-overlapping-intervals | Medium | VERIFIED | PASS (40 ms) | PASS (388 ms) | rejected (starter cpp 7/10; starter java 7/10; wrong-keep-first.cpp 4/10) |  |
| 66 | meeting-rooms | Easy | VERIFIED | PASS (64 ms) | PASS (234 ms) | rejected (starter cpp 5/10; starter java 5/10; wrong-touching.cpp 3/10) |  |
| 67 | meeting-rooms-ii | Medium | VERIFIED | PASS (88 ms) | PASS (238 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-touching.cpp 3/10) |  |
| 68 | number-of-1-bits | Easy | VERIFIED | PASS (12 ms) | PASS (129 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-30-bits.cpp 5/10) |  |
| 69 | counting-bits | Easy | VERIFIED | PASS (52 ms) | PASS (195 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-length.cpp 10/10) |  |
| 70 | reverse-bits | Easy | VERIFIED | PASS (17 ms) | PASS (215 ms) | rejected (starter cpp 9/10; starter java 9/10; wrong-31-bits.cpp 9/10) |  |
| 71 | missing-number | Easy | VERIFIED | PASS (24 ms) | PASS (169 ms) | rejected (starter cpp 8/10; starter java 8/10) | slow.cpp: passes; slow.java: passes |
| 72 | sum-of-two-integers | Medium | VERIFIED | PASS (14 ms) | PASS (157 ms) | rejected (starter cpp 7/10; starter java 7/10) |  |
| 73 | rotate-image | Medium | VERIFIED | PASS (19 ms) | PASS (156 ms) | rejected (starter cpp 8/10; starter java 8/10; wrong-counterclockwise.cpp 8/10) |  |
| 74 | spiral-matrix | Medium | VERIFIED | PASS (16 ms) | PASS (144 ms) | rejected (starter cpp 10/10; starter java 10/10; wrong-no-guard.cpp 3/10) |  |
| 75 | set-matrix-zeroes | Medium | VERIFIED | PASS (34 ms) | PASS (329 ms) | rejected (starter cpp 6/10; starter java 6/10; wrong-cascade.cpp 5/10) |  |

## Blocked problems

None.

## Key decisions

Full list in `DECISIONS.md`. The ones that matter most when seeding and running the platform:

- The optional `slug` field added to `src/models/problem.js` (approved) is **not committed**; commit it with
  the seed, or `seed.js` falls back to matching problems by title.
- Each problem stores 3 examples, sample 1 as `visibleTestCase` (Run) and all 10 tests in `hiddenTestCases` (Submit).
- No per-problem time limits reach Judge0 (platform limitation), so the 5 s default applies; with inputs capped at
  200 KB, O(n^2) array solutions are usually **not** caught (see the slow-solution column).
- Recursive Java DFS overflows near 10^4 levels on Judge0's default JVM stack; grid tests are sized below that.
- Problems with several correct answers are normalised in the driver (sorting), made unique by the generator,
  or validated (Alien Dictionary). Design problems use LeetCode's operations/arguments format.
- Reference solutions are seeded into `referenceSolutions` (shown on the Solution tab after solving).

## How to seed

Run from `backend/`. The first command touches no database; the second only reads it.

```
node seed/seed.js --dry-run
node seed/seed.js --dry-run --connect --creator <admin email>
node seed/seed.js --creator <admin email> --yes
```

To re-check everything first (needs the local Judge0): `node seed/tools/build.js --all --check`, then
`node seed/tools/verify.js --all`.
