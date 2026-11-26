# Oncode pre-release QA report

Branch **`qa/pre-release`** (from `main` @ `0e27f0c`), 2026-11-26. 15 commits, **nothing pushed**.

## Verdict

**GO, with two conditions** (details in §9):

1. **Judge0 capacity (QA-02, High).** On this Judge0, two submissions at the same time can exceed the 30 s
   `JUDGE0_DEADLINE_MS`. The user then sees "Code execution is temporarily unavailable" and gets a `System Error`
   record. Before launch, measure the production EC2 Judge0 with `scripts/qa/judge-capacity.mjs` and size it (or raise
   the deadline). The decision on per-submission time limits is yours (§9, Q1).
2. **Run `backend/scripts/drop-demo-artifacts.js --apply` after the deploy (QA-03).** Production still runs the
   pre-guest-mode backend and carries demo-era indexes and fields.

No bug was found in auth, authorization, IDOR, hidden-test exposure, NoSQL injection, XSS or guest data isolation.
Eight real bugs were found and fixed (4 Medium, 4 Low). The most important: users signed out by any transient
backend error (QA-06), editor drafts visible to the next account on a shared browser (QA-07), and guest session
creation failing open during a Redis outage (QA-09). All 75 problems pass for C++ and Java.

Top risks:

| # | Risk | Why it matters |
|---|---|---|
| 1 | Judge0 throughput (QA-02) | Concurrent users get 503 / System Error instead of a verdict. An infinite loop costs about 10 × 5 s of Judge0 CPU. |
| 2 | Production deploy order (QA-03) | The 89 submissions in production were written by the old build. The new build must be deployed, then the cleanup script run. |
| 3 | Atlas M0 egress | Each Submit still reads up to 750 KB of hidden tests from Atlas. M0 caps data transfer (§7, recommendation R3). |
| 4 | Not tested here (§8) | Production Judge0 on EC2, Lighthouse scores, real cold start on the free host, Vercel CSP with the real API origin. |

## 0. Test environment

| Piece | Used for QA | Notes |
|---|---|---|
| MongoDB | Local Docker `mongo:7` (replica set), db **`oncode_test`** on 127.0.0.1:27018 | `backend/.env` points at **production Atlas** (`cluster0…mongodb.net/oncode`) and was never written to. With your OK, read-only checks ran against it (`scripts/qa/check-problems.js` plus index/field counts). |
| Redis | Local Docker `redis:7-alpine` on 127.0.0.1:6380 | `.env` points at production Redis Cloud, which was never used. |
| Judge0 | Your local Judge0 CE 1.13.1 in WSL (localhost:2358) | Real executions. Default worker settings. Memory numbers are virtual-memory based (no cgroups in WSL). |
| Gemini | Real key from `.env` | About 4 AI tutor calls in total. |
| Data | 75 problems seeded from `backend/seed/problems` (identical to production, checked field by field), QA accounts `*@qa.oncode.test` (`scripts/qa/fixtures.js`) | |

Reproduce: start the containers (header of `scripts/qa/stack.mjs`), `node scripts/qa/setup-local.js`, run the seed command
it prints, then use `.claude/launch.json` entries `qa-backend`, `qa-backend-nojudge`, `qa-frontend`, `qa-preview`.
Clean up: `node scripts/qa/setup-local.js --cleanup`, then
`wsl -d Ubuntu -- docker rm -f oncode-qa-mongo oncode-qa-redis`.

## 1. Map and build

### API endpoints

| Method | Path | Auth | Rate limit | Notes |
|---|---|---|---|---|
| GET | `/healthz`, `/api/health` | none | – | liveness / wake-up ping |
| GET | `/readyz` | none | – | Mongo + Redis ping (not Judge0) |
| POST | `/user/register` | none | 10 / 15 min / IP | strict body; role forced to `user` |
| POST | `/user/login` | none | 5 failed / 15 min / (IP, email) + 50 / 15 min / IP | |
| POST | `/user/guest` | none | 10 / h / IP, **fails closed** without Redis | 4 h JWT `{typ:"guest",gid}` |
| POST | `/user/logout` | user or guest | – | token added to the Redis blocklist |
| POST | `/user/admin/register` | **admin** | – | creates a user or an admin |
| GET | `/user/profile`, `/user/check` | user (guest 403) | – | |
| DELETE | `/user/profile` | user (guest 403) | – | cascades submissions; 409 for the last admin (new) |
| GET | `/problem` | optional | – | paginated (default 20, max 100); search, difficulty, topic, status |
| GET | `/problem/solved` | user | – | |
| GET | `/problem/:idOrSlug` | user or guest | – | public fields only |
| GET | `/problem/:id/admin` | **admin** | – | hidden tests, drivers, references |
| GET | `/problem/:id/solution` | user or guest | – | admin, or a user who solved it; guests always locked |
| GET | `/problem/submissions/:id` | user or guest | – | own submissions only; guests see the current session only |
| POST / PUT / DELETE | `/problem`, `/problem/:id` | **admin** | – | create and update re-run reference solutions on Judge0 |
| POST | `/submission/run/:id`, `/submission/submit/:id` | user or guest | 50 / 15 min / IP; guests also 300 / 15 min global and 30 per session | |
| GET | `/submission/:id` | user or guest | – | owner-scoped (404 otherwise) |
| GET | `/submission/health` | **admin** | – | Judge0 diagnostic, no host or port in the response |
| GET | `/admin/dashboard` | **admin** | – | |
| POST | `/chatAI/doubt` | user or guest | 10 / 10 min / user and 20 / 10 min / IP; guests 5 per session | |

### Frontend routes

| Path | Guard | Page |
|---|---|---|
| `/` | public | problem list |
| `/login`, `/signup` | public | open the auth modal on `/` |
| `/problems/:slug` | user or guest | workspace |
| `/problem/:id` | – | legacy redirect to `/problems/:id` |
| `/profile` | user (a guest gets the sign-up prompt) | profile and stats |
| `/admin`, `/admin/problems`, `/admin/create-problem`, `/admin/update-problem/:id`, `/admin/users` | admin | admin area |
| `*` | – | 404 page |

### Lint, build, tests, audit

| Check | Backend before → after | Frontend before → after |
|---|---|---|
| `npm run lint` | pass → pass | pass → pass |
| `npm run build` | – | pass → pass (workspace chunk 772 → 54.5 KB gzip, §7) |
| `npm test` | 179 → **182** pass | 35 → **45** pass |
| `npm audit --omit=dev` | 0 vulnerabilities | 2 moderate, build-time only (`@tailwindcss/typography` → `postcss-selector-parser`) |
| `npm audit` (with dev) | 2 moderate (`nodemon` → `minimatch`, dev only) | same 2 |

None of the audit findings ship to users. `npm audit fix --force` would downgrade nodemon and typography (breaking),
so it is not applied. Revisit when upstream releases fixes.

### Env vars

The code reads exactly the variables in `backend/.env.example` and the README, plus `NODE_ENV` (now added to the
example). The frontend reads only `VITE_API_URL`. Your `backend/.env` has `USER_ID`, which no code uses (safe to
delete), and lacks the optional `JUDGE0_TIMEOUT_MS`, `JUDGE0_DEADLINE_MS`, `TRUST_PROXY_HOPS`, `LOG_LEVEL`,
`GUEST_MODE_ENABLED` and `NODE_ENV` (defaults apply).

## 2. Bugs

Severity: High = core flow broken under realistic conditions. Medium = data or session loss, or a privacy leak, in a
plausible scenario. Low = visible defect with a workaround.

| ID | Sev | Summary | Steps to reproduce | Root cause | Fix | Status |
|---|---|---|---|---|---|---|
| QA-02 | **High** (capacity) | Concurrent submissions get 503 and a `System Error` record | Two users press Submit at once (or one infinite loop is running): see §5 numbers. Screenshot `scripts/qa/results/screenshots/QA-02-system-error-under-load.jpg` | One submission is 10 Judge0 jobs, each up to 5 s CPU (no per-submission limits are sent). Local Judge0 needs 8–25 s for one submission, so two exceed `JUDGE0_DEADLINE_MS` = 30 s. | Docs only (README "Judge0", capacity). Code options in §9, Q1. | **Open, needs your decision** |
| QA-06 | Medium | Users signed out on any failed session check | Sign in, then make `GET /user/check` fail with a network error or 503 (backend asleep or restarting, Mongo blip), e.g. reload while the API is down. The token is deleted. With two tabs, one tab's failure signs out both. Reproduced live: a second tab on the same origin deleted the token ~40 ms after every login. | `checkAuth` removed `localStorage.token` in its `catch`, for every error. The API answers 503 on purpose so that clients keep the token. | `080dd85`: only a 401 discards the token; tests for network error / 503 / 401 | Fixed, re-tested in browser |
| QA-07 | Medium | Editor drafts leak between accounts on a shared browser | User A writes code on Two Sum and logs out. A guest (or user B) opens Two Sum and sees A's code. | Draft key `oncode:code:<problemId>:<lang>` had no owner. | `9fd51b5`: keys include the user id or guest session id; old unscoped keys are purged. `8033776`: a guest who signs up or logs in keeps that session's drafts. | Fixed, re-tested in browser |
| QA-09 | Medium (security control) | Guest session creation fails **open** when Redis is down | Stop Redis, `POST /user/guest` → 201 with a 4 h token, with no per-IP limit, repeatable without bound. The tokens work once Redis is back. | `failClosed()` treated any call of the limiter's `next()` as "allowed". express-rate-limit reports a store error as `next(error)` rather than throwing. The existing test only covered guest Run, where the controller's own quota check (which does fail closed) masked it. | `6058029`: `next(err)` and throws both answer 503; new test | Fixed, re-tested with a real Redis stop |
| QA-08 | Medium | The only admin can delete their own account | Profile → Delete Account as the only admin. Nobody can reach `/admin` afterwards; only a DB edit recovers. | No guard in `deleteProfile`. | `8bb8f61`: 409 while the caller is the last admin (modal shows the message) | Fixed, tested |
| QA-01 | Low | A rejected duplicate problem title burns a problem number | Admin: create a problem titled "Two Sum" (rejected 400), then create a valid one: it gets number 77, not 76. | `pre('save')` takes the next counter value before the insert fails on the unique title index (and only after a full Judge0 run). | `158d6bd`: title and slug uniqueness checked first; regression test | Fixed, tested |
| QA-04 | Low | Search box shows stale text | Search "tree", then click the Oncode logo: the list shows all 75 but the box still says "tree" and "Reset filters" stays. Screenshot `QA-04-stale-search-box.jpg` | The box state was initialised from `?search=` once and never re-synced. | `29cb29c` | Fixed, re-tested in browser |
| QA-05 | Low | Page past the end shows nonsense | Open `/?page=99`: "No problems found … match your filters" and "Showing 981 to 75 of 75 problems". | No clamp to the last page. | `1e4bb59`: redirect to the last page | Fixed, re-tested in browser |
| QA-03 | Info | Production data still has demo-era leftovers | Read-only check: `users` and `submissions` have `isDemo_1` and `expiresAt_1` (TTL) indexes. All 89 submissions written today and the admin carry `isDemo:false, expiresAt:null`, so the deployed backend is still the old build. The TTL is harmless (every `expiresAt` is null). | Pending deploy | Run `drop-demo-artifacts.js --apply` after the deploy (§10) | Release step |

Also noted (not bugs, no change made):
- A System Error result shows "0 / 0 testcases passed" (cosmetic).
- Lazy chunks (routes and now the editor) have no error boundary: if a chunk download fails (deploy swapped hashes, flaky network) the page goes blank. Recommend a small error boundary with "Reload".
- The 0.5 s editor-draft debounce means the last keystrokes before leaving the page can be lost (pre-existing, commented in code).
- When a submit is abandoned mid-way (user leaves), Judge0 still runs it and the record is still saved. That is fine.
- `hiddenTestCases` is capped at 100 by validation, but each test is one Judge0 job. Consider capping admin-created
  problems at 10 to match the seed (QA-02).
- `backend/backups/2026-11-26T06-08-22-559Z/` (git-ignored) holds a production export including `users.json` with
  emails and password hashes. Keep it somewhere safe or delete it after the release.
- `.claude/` (launch configs, possibly local settings) is untracked and not git-ignored. Add it to `.gitignore` or
  commit only `launch.json` deliberately.

### Areas reviewed with no bug found

- **Auth / authz:** every admin route checks the role from MongoDB (a forged `role:"admin"` claim gets 403).
  `alg:none`, foreign-key and expired tokens get 401. Logout revokes. Login is timing-safe for unknown emails.
  CORS allows only `CLIENT_URL`. Helmet is on.
- **Validation and injection:** strict zod bodies. `{ "$ne": null }` login gets 400. `sanitizeFilter` is on. Search
  regex is escaped (`.*` matches nothing). Body limits are 100 KB (5 MB for `/problem`).
- **IDOR:** another user's, a guest's or another guest session's submission answers 404, for admins too (the owner
  route has no admin bypass).
- **Hidden tests:** never in list, detail, run or submit responses. The failing hidden input is stored admin-only
  (`select:false`). Run returns only the visible test.
- **Guest mode:** every user-only and admin route answers 403 `GUEST_NOT_ALLOWED`. Guest submissions live in a TTL
  collection and are invisible to other sessions. Guest quota is refunded when Judge0 fails. Guests fail closed
  without Redis (after the QA-09 fix). No demo-account code or credentials remain (only the one-off cleanup script).
- **Judge0 flow:** language ids 54/62, status mapping 1–14, CE/RE/TLE/WA verdicts correct (§3).
  Judge0 down → 503 within ~50 ms with no `Pending` record (`scripts/qa/judge-down.mjs`). Starved compiles count as
  unavailable, not as Compilation Error.
- **Stale references:** problem delete cascades to submissions, guest submissions and `problemsSolved` (verified).
  Profile delete cascades submissions. Production has no orphaned submissions or solved ids.
- **Frontend:** markdown (problem statements and AI replies) does not render raw HTML; an AI reply containing
  `<img onerror>` and `javascript:` links rendered as text. Logout clears Redux and storage. Protected routes hold on
  deep links and refresh. Loading, error and empty states exist on every page. Double-clicking Submit sends one
  request.

## 3. The 75 problems

**Structure (read-only, production Atlas and local copy, `scripts/qa/check-problems.js`): 75 / 75 OK.**
Exactly 75 problems, numbered 1–75. Unique slugs, titles and numbers. Every problem has a description, examples,
difficulty, topics, constraints, a visible test, 1–10 hidden tests (all have 10), C++ and Java starter + driver
(with `{{USER_CODE}}`) + reference solution, and an existing admin as creator. Every production problem equals its
seed file. 19 Easy / 49 Medium / 7 Hard.

**Execution (real pipeline: `POST /submission/submit` → local Judge0, `scripts/qa/run-submissions.mjs`):**

**75 / 75 PASS.** The C++ and the Java reference solution are Accepted on all 10 hidden tests of every problem, and
all 45 sampled negative checks (every 7th problem: the seed's known-wrong solution, an infinite loop, a runtime
crash, a compile error) gave the expected verdict (Wrong Answer, Time Limit Exceeded, Runtime Error (NZEC),
Compilation Error). 58 problems passed on the first full run. The other 17 hit the Judge0 deadline (16, QA-02 backlog)
or a harness bug (1: fault injection assumed `class Solution`), and all 17 passed on an isolated re-run.
Raw data: `scripts/qa/results/submissions*.{md,json}`, `rerun-*.{md,json}`.

| # | problem | C++ correct | Java correct | wrong / TLE / RTE / CE (sample) | result | note |
|---|---|---|---|---|---|---|
| 1 | contains-duplicate | Accepted 10/10 (11.0 s) | Accepted 10/10 (13.3 s) | tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS |  |
| 2 | valid-anagram | Accepted 10/10 (9.4 s) | Accepted 10/10 (11.0 s) |  | PASS |  |
| 3 | two-sum | Accepted 10/10 (11.4 s) | Accepted 10/10 (13.3 s) |  | PASS |  |
| 4 | group-anagrams | Accepted 10/10 (54.3 s) | Accepted 10/10 (19.1 s) |  | PASS |  |
| 5 | top-k-frequent-elements | Accepted 10/10 (16.7 s) | Accepted 10/10 (13.9 s) |  | PASS |  |
| 6 | encode-and-decode-strings | Accepted 10/10 (16.2 s) | Accepted 10/10 (13.4 s) |  | PASS |  |
| 7 | product-of-array-except-self | Accepted 10/10 (11.6 s) | Accepted 10/10 (14.1 s) |  | PASS |  |
| 8 | longest-consecutive-sequence | Accepted 10/10 (14.1 s) | Accepted 10/10 (13.5 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS |  |
| 9 | valid-palindrome | Accepted 10/10 (11.6 s) | Accepted 10/10 (18.3 s) |  | PASS |  |
| 10 | 3sum | Accepted 10/10 (19.0 s) | Accepted 10/10 (15.5 s) |  | PASS |  |
| 11 | container-with-most-water | Accepted 10/10 (16.4 s) | Accepted 10/10 (15.7 s) |  | PASS |  |
| 12 | best-time-to-buy-and-sell-stock | Accepted 10/10 (16.3 s) | Accepted 10/10 (13.5 s) |  | PASS |  |
| 13 | longest-substring-without-repeating-characters | Accepted 10/10 (13.3 s) | Accepted 10/10 (20.9 s) |  | PASS |  |
| 14 | longest-repeating-character-replacement | Accepted 10/10 (46.4 s) | Accepted 10/10 (13.4 s) |  | PASS |  |
| 15 | minimum-window-substring | Accepted 10/10 (13.6 s) | Accepted 10/10 (15.8 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS |  |
| 16 | find-minimum-in-rotated-sorted-array | Accepted 10/10 (14.6 s) | Accepted 10/10 (13.3 s) |  | PASS |  |
| 17 | search-in-rotated-sorted-array | Accepted 10/10 (16.5 s) | Accepted 10/10 (18.7 s) |  | PASS |  |
| 18 | reverse-linked-list | Accepted 10/10 (21.0 s) | Accepted 10/10 (18.3 s) |  | PASS |  |
| 19 | merge-two-sorted-lists | Accepted 10/10 (12.2 s) | Accepted 10/10 (19.4 s) |  | PASS |  |
| 20 | linked-list-cycle | Accepted 10/10 (20.1 s) | Accepted 10/10 (20.7 s) |  | PASS |  |
| 21 | reorder-list | Accepted 10/10 (14.3 s) | Accepted 10/10 (15.1 s) |  | PASS |  |
| 22 | remove-nth-node-from-end-of-list | Accepted 10/10 (17.9 s) | Accepted 10/10 (13.6 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS |  |
| 23 | merge-k-sorted-lists | Accepted 10/10 (48.1 s) | Accepted 10/10 (19.5 s) |  | PASS |  |
| 24 | valid-parentheses | Accepted 10/10 (13.9 s) | Accepted 10/10 (16.5 s) |  | PASS |  |
| 25 | invert-binary-tree | Accepted 10/10 (19.1 s) | Accepted 10/10 (13.8 s) |  | PASS |  |
| 26 | maximum-depth-of-binary-tree | Accepted 10/10 (18.5 s) | Accepted 10/10 (18.3 s) |  | PASS |  |
| 27 | same-tree | Accepted 10/10 (13.2 s) | Accepted 10/10 (13.6 s) |  | PASS |  |
| 28 | subtree-of-another-tree | Accepted 10/10 (11.1 s) | Accepted 10/10 (13.5 s) |  | PASS |  |
| 29 | lowest-common-ancestor-of-a-binary-search-tree | Accepted 10/10 (14.3 s) | Accepted 10/10 (16.3 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS |  |
| 30 | binary-tree-level-order-traversal | Accepted 10/10 (10.9 s) | Accepted 10/10 (10.7 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 31 | validate-binary-search-tree | Accepted 10/10 (11.2 s) | Accepted 10/10 (16.3 s) |  | PASS |  |
| 32 | kth-smallest-element-in-a-bst | Accepted 10/10 (14.3 s) | Accepted 10/10 (21.1 s) |  | PASS |  |
| 33 | construct-binary-tree-from-preorder-and-inorder-traversal | Accepted 10/10 (21.5 s) | Accepted 10/10 (19.4 s) |  | PASS |  |
| 34 | binary-tree-maximum-path-sum | Accepted 10/10 (22.2 s) | Accepted 10/10 (15.8 s) |  | PASS |  |
| 35 | serialize-and-deserialize-binary-tree | Accepted 10/10 (51.0 s) | Accepted 10/10 (21.8 s) |  | PASS |  |
| 36 | implement-trie-prefix-tree | Accepted 10/10 (6.4 s) | Accepted 10/10 (8.5 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS | first run: harness injected nothing (class not named Solution); re-run OK |
| 37 | design-add-and-search-words-data-structure | Accepted 10/10 (14.0 s) | Accepted 10/10 (18.1 s) |  | PASS |  |
| 38 | word-search-ii | Accepted 10/10 (6.4 s) | Accepted 10/10 (8.4 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 39 | combination-sum | Accepted 10/10 (6.3 s) | Accepted 10/10 (8.7 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 40 | word-search | Accepted 10/10 (10.2 s) | Accepted 10/10 (13.1 s) |  | PASS |  |
| 41 | find-median-from-data-stream | Accepted 10/10 (13.6 s) | Accepted 10/10 (16.0 s) |  | PASS |  |
| 42 | number-of-islands | Accepted 10/10 (13.4 s) | Accepted 10/10 (11.2 s) |  | PASS |  |
| 43 | clone-graph | Accepted 10/10 (6.2 s) | Accepted 10/10 (8.3 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS | first run: 503 deadline on tle cpp, rte cpp, ce cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 44 | pacific-atlantic-water-flow | Accepted 10/10 (6.5 s) | Accepted 10/10 (8.5 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 45 | course-schedule | Accepted 10/10 (7.3 s) | Accepted 10/10 (8.4 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 46 | graph-valid-tree | Accepted 10/10 (14.9 s) | Accepted 10/10 (13.7 s) |  | PASS |  |
| 47 | number-of-connected-components-in-an-undirected-graph | Accepted 10/10 (14.3 s) | Accepted 10/10 (13.3 s) |  | PASS |  |
| 48 | alien-dictionary | Accepted 10/10 (6.5 s) | Accepted 10/10 (8.3 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 49 | climbing-stairs | Accepted 10/10 (10.8 s) | Accepted 10/10 (13.0 s) |  | PASS |  |
| 50 | house-robber | Accepted 10/10 (6.3 s) | Accepted 10/10 (8.3 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 51 | house-robber-ii | Accepted 10/10 (15.7 s) | Accepted 10/10 (8.3 s) |  | PASS |  |
| 52 | longest-palindromic-substring | Accepted 10/10 (8.6 s) | Accepted 10/10 (16.0 s) |  | PASS |  |
| 53 | palindromic-substrings | Accepted 10/10 (52.5 s) | Accepted 10/10 (19.6 s) |  | PASS |  |
| 54 | decode-ways | Accepted 10/10 (15.6 s) | Accepted 10/10 (18.0 s) |  | PASS |  |
| 55 | coin-change | Accepted 10/10 (18.1 s) | Accepted 10/10 (18.1 s) |  | PASS |  |
| 56 | maximum-product-subarray | Accepted 10/10 (6.2 s) | Accepted 10/10 (8.3 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 57 | word-break | Accepted 10/10 (13.2 s) | Accepted 10/10 (15.1 s) | tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS |  |
| 58 | longest-increasing-subsequence | Accepted 10/10 (16.2 s) | Accepted 10/10 (15.6 s) |  | PASS |  |
| 59 | unique-paths | Accepted 10/10 (14.8 s) | Accepted 10/10 (14.8 s) |  | PASS |  |
| 60 | longest-common-subsequence | Accepted 10/10 (8.6 s) | Accepted 10/10 (10.4 s) |  | PASS |  |
| 61 | maximum-subarray | Accepted 10/10 (6.4 s) | Accepted 10/10 (6.4 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 62 | jump-game | Accepted 10/10 (6.5 s) | Accepted 10/10 (6.4 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 63 | insert-interval | Accepted 10/10 (6.5 s) | Accepted 10/10 (8.6 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 64 | merge-intervals | Accepted 10/10 (6.4 s) | Accepted 10/10 (8.4 s) | wrong: Wrong Answer<br>tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS | first run: 503 deadline on correct cpp, wrong cpp (wrong-strict.cpp) (Judge0 backlog, QA-02); isolated re-run OK |
| 65 | non-overlapping-intervals | Accepted 10/10 (6.3 s) | Accepted 10/10 (8.4 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 66 | meeting-rooms | Accepted 10/10 (6.4 s) | Accepted 10/10 (8.5 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 67 | meeting-rooms-ii | Accepted 10/10 (14.0 s) | Accepted 10/10 (15.4 s) |  | PASS |  |
| 68 | number-of-1-bits | Accepted 10/10 (13.3 s) | Accepted 10/10 (15.0 s) |  | PASS |  |
| 69 | counting-bits | Accepted 10/10 (13.3 s) | Accepted 10/10 (13.2 s) |  | PASS |  |
| 70 | reverse-bits | Accepted 10/10 (10.9 s) | Accepted 10/10 (12.9 s) |  | PASS |  |
| 71 | missing-number | Accepted 10/10 (11.5 s) | Accepted 10/10 (11.7 s) | tle: Time Limit Exceeded<br>rte: Runtime Error (NZEC)<br>ce: Compilation Error | PASS |  |
| 72 | sum-of-two-integers | Accepted 10/10 (10.8 s) | Accepted 10/10 (13.0 s) |  | PASS |  |
| 73 | rotate-image | Accepted 10/10 (6.4 s) | Accepted 10/10 (6.3 s) |  | PASS | first run: 503 deadline on correct cpp (Judge0 backlog, QA-02); isolated re-run OK |
| 74 | spiral-matrix | Accepted 10/10 (11.4 s) | Accepted 10/10 (13.0 s) |  | PASS |  |
| 75 | set-matrix-zeroes | Accepted 10/10 (11.6 s) | Accepted 10/10 (11.5 s) |  | PASS |  |

75 problems: 75 PASS (C++ and Java reference Accepted on every hidden test). 58 passed on the first run; 17 needed an isolated re-run (QA-02 / harness). Sampled negative checks: 45/45 gave the expected verdict.

## 4. API tests

`scripts/qa/api-tests.mjs`: **147 / 147 pass** (`scripts/qa/results/api-tests.md`). Covered: health, 404, malformed
JSON, 413, CORS, helmet; register/login happy and invalid paths, duplicate, weak password, role injection, NoSQL
injection, case-insensitive email; missing, garbage, expired, foreign-key, `alg:none` and forged-role tokens;
logout revocation; guest token shape and 11 forbidden routes; list pagination, page past the end, search (with regex
characters), difficulty, topic, status, invalid query params; problem by slug, by id and unknown; admin-only detail;
solution lock and unlock; run and submit for Accepted / Wrong Answer, unsupported language, oversized code, bad and
unknown ids; unicode, `$&` and `{{USER_CODE}}` inside user code; submission history and IDOR (user, guest, admin);
guest submit isolation; admin create (Judge0-validated, wrong reference rejected), update, delete and cascade; topic
cache invalidation on create, update and delete; admin register; profile stats and delete cascade; AI tutor for a
user and a guest (quota charged) and its validation; rate limits on login (per email and per IP), register, guest
creation, run/submit and AI.

Judge0 down (`scripts/qa/judge-down.mjs`): run/submit 503 in < 100 ms, no `Pending` records, guest quota refunded,
nothing stored, admin health 503 with no host details, rest of the site unaffected.

Redis down (`scripts/qa/redis-down.mjs`, real container stop/start; `results/redis-down.txt`), after the QA-09 fix:

| Request with Redis stopped | Result |
|---|---|
| `GET /readyz` | 503 (Mongo ok, Redis down) |
| `GET /problem` | 200 (topic cache falls back to MongoDB) |
| login, `/user/check` | 200 (limiters and blocklist fail open, by design) |
| `POST /user/guest` | **503 GUEST_MODE_UNAVAILABLE** (was 201 before QA-09) |
| guest run / AI tutor | 503 GUEST_MODE_UNAVAILABLE |
| `POST /user/logout` | 503 (the token cannot be revoked; the SPA still signs out locally, and the token stays valid until it expires, at most 1 h; by design, BUG-04) |
| after `docker start` | `/readyz` 200 within ~1 s; guest sessions and logout revocation work again |

## 5. Browser tests (production-like build and dev server, built-in browser)

| Flow | Result |
|---|---|
| Landing / problem list: 75 problems, 10 per page, 8 pages, search (debounced), difficulty, topic, deep links with filters | OK (QA-04, QA-05 fixed) |
| Sign-up: client validation, success | OK after QA-06 fix |
| Login, redirect to the problem clicked, refresh on a deep link, logout, Back to a protected page | OK |
| Guest mode: start, notice, badge, workspace, `/profile` → sign-up prompt, `/admin` → sign-in | OK (QA-07 fixed) |
| Workspace: markdown, examples, C++ ↔ Java switch, drafts restored after reload, Run (Accepted, with unicode/emoji in code), Submit, history, locked solution, AI tutor (XSS probe) | OK |
| Double-click Submit | one request |
| Leave mid-run | no errors |
| Judge0 under load | System Error (QA-02) |
| Profile stats (System Error excluded) | OK |
| Admin: dashboard, manage problems (4 pages of 20), create form, update form prefilled, user management | OK |
| Responsive 375 / 768 / 1280 px | no horizontal overflow; mobile problem/editor switch works |
| Console | no errors except expected 403 (locked solution) and 503 (Judge0) responses |

### Judge0 capacity (QA-02), `scripts/qa/judge-capacity.mjs`, Judge0 otherwise idle

Local Judge0 CE 1.13.1, default workers (~16 on 8 CPUs), two-sum, C++:

| Scenario | Wall time | Result |
|---|---|---|
| 1 correct submission | 11.5 s | Accepted |
| 1 infinite loop (10 × TLE) | 18.8 s | Time Limit Exceeded |
| 2 concurrent correct | 26.9 s | **both 503** (deadline) |
| 3 concurrent correct | 24.4 s | Accepted ×3 (right after the previous round; timing varies) |
| 1 correct + 1 infinite loop | 29.8 s | **both 503** |

In the full 75-problem run, 16 problems hit the deadline on their first (C++) submission even though the script sends
one submission at a time. Each failed attempt took ~28 s, and the failures cluster (problems 43–66). The reason:
when the backend gives up, **Judge0 keeps running the abandoned batch**, so the next submission queues behind it and
times out too. A single slow moment can cascade. Mitigations: R1/R2 in §7. The cascade also argues for sending time
limits and not just raising the deadline.

Caveat: this Judge0 runs in WSL without cgroups, so compiles are slow (~1–2.5 s per C++ job). Production EC2 may be
faster or slower. Measure it (§8.1).

## 6. Smoke test suite

A suite already exists and runs in CI (`.github/workflows/ci.yml`): backend vitest + supertest against real
Mongo/Redis with a mock Judge0, covering auth, guest mode, problem list and slugs, submit flow (mock verdicts, Judge0
down, starved compile), admin authorization matrix and data exposure; frontend vitest for auth/session handling,
guest UI, workspace buffers and drafts. Added on this branch: duplicate-title numbering, last-admin delete, checkAuth
on network/503/401, guest session creation with Redis down, draft scoping and adoption (backend 179 → 182, frontend 35 → 45).

## 7. Performance

### Measured

| Item | Measurement |
|---|---|
| Mongo indexes (`scripts/qa/perf-explain.js`) | Every hot query is an IXSCAN: list (number index), slug, email, submission history `{userId, problemId, createdAt}`, stats `{userId, status}`, guest history. Search and topic filters scan the 75-entry number index (fine at this size). |
| Problem documents | avg 239 KB, max 751 KB (hidden tests up to 730 KB); 17.6 MB in total (M0 storage limit 512 MB) |
| List payload | 20 rows 4.0 KB (1.0 KB gzip), 100 rows 13.6 KB (2.6 KB gzip), summary fields only, `.lean()` |
| Run: problem read per request | full doc 752 KB / 19.5 ms → **19 KB / 3.7 ms** (largest problem, local Mongo) |
| Landing JS (gzip) | ~126 KB (react, router, redux, axios, lucide, Home); zod and the auth form only load with the modal |
| Problem page JS (gzip) | before: +772 KB in one chunk, so nothing rendered until Monaco arrived. After: +54.5 KB workspace, Monaco 717 KB in a parallel lazy chunk (statement renders first) |
| Judge0 polling | first poll right away, then every 2 s, so results arrive in 2 s steps |

Lighthouse could not be run here (no Lighthouse tool; the browser pane was hidden, so no paint metrics). Steps in §8.

### Done (small, safe)

| Change | Commit | Gain |
|---|---|---|
| Run/Submit read only the needed fields (`select` + `lean`) | `9d0c6ff` | Run: −97% bytes from Atlas per request (750 → 19 KB on the largest problem), less CPU for hydration; Submit skips description, references and hydration |
| Monaco as its own lazy chunk, download started in parallel | `89cdc3c` | Problem statement no longer waits for 772 KB gzip. Roughly 3–4 s earlier on a 1.6 Mbit/s connection, same total bytes |
| Duplicate check before the Judge0 validation run | `158d6bd` | A duplicate title no longer costs a full Judge0 run |

### Recommended (not done)

| # | Recommendation | Expected gain | Effort | Risk |
|---|---|---|---|---|
| R1 | Send `cpu_time_limit` (e.g. 2 s) and `wall_time_limit` per submission (from `seedMeta.limits`, stored on the problem). Optionally stop polling once a test fails. | Infinite loops cost ~2 s instead of 5 s per test; fixes most of QA-02 | M | Behaviour change: slow-but-correct solutions may become TLE. Seed verify flags references > 50% of the limit. |
| R2 | Size production Judge0 (`COUNT` workers, CPU) and/or set `JUDGE0_DEADLINE_MS=60000` (the frontend already waits 60 s) | Removes 503s at small concurrency | S (config) | Longer waits under load |
| R3 | Cache hidden tests + drivers in backend memory (LRU keyed by `_id` + `updatedAt`, ~18 MB for all 75) | Submit stops pulling up to 750 KB from Atlas each time (M0 egress cap); −20–100 ms per submit | M | Memory per instance; invalidate on update |
| R4 | Poll Judge0 sooner: 0.5 s, 1 s, then 2 s | ~1 s faster average Run/Submit | S | A few more Judge0 GETs |
| R5 | Prefetch the editor chunk on hover / focus of a problem card | Editor ready on arrival | S | Wasted bytes if not opened |
| R6 | Trim Monaco further (drop unused editor contributions) | 100–300 KB gzip | M | Missing editor features |
| R7 | Problem list: a `{difficulty, number}` index once there are hundreds of problems | None today | S | None |

## 8. Not tested here: steps for you

1. **Production Judge0 capacity.** Point a local backend at the EC2 Judge0 only (`JUDGE0_BASE_URL`,
   `JUDGE0_AUTH_TOKEN`), keep Mongo/Redis on the QA containers (`scripts/qa/stack.mjs backend`, edit nothing else), run
   `node scripts/qa/judge-capacity.mjs`, and compare with §5. If "2 concurrent correct" shows a 503, apply R1/R2.
2. **Lighthouse.** Deploy a preview to Vercel (or `cd frontend && npm run build && npx vite preview`), then in Chrome
   DevTools → Lighthouse (mobile) run `/`, `/problems/two-sum` (signed in) and record Performance / Accessibility /
   Best practices.
3. **Real cold start.** After the backend host sleeps, open the site: the "server waking up" banner should show and
   you must stay signed in (QA-06 fix).
4. **CSP with the real API origin.** On the Vercel preview, confirm no CSP violations in the console
   (`connect-src` must include the production API URL).
5. **Production smoke** (§10).

## 9. Decisions for you

- **Q1 (QA-02).** Should Judge0 receive per-submission time limits (R1)? That changes verdicts (a solution near 5 s
  becomes TLE). Or should we only scale Judge0 and raise `JUDGE0_DEADLINE_MS` (R2)?
- **Q2.** The admin's 89 test submissions in production (10 are `System Error` from an outage). Keep or delete? I did
  not touch them.

## 10. Release

### Production env checklist (backend host secret store)

- [ ] `NODE_ENV=production`
- [ ] `MONGO_URI`: Atlas, db `oncode`; Atlas network access limited to the backend host
- [ ] `JWT_KEY`: 64 random hex chars, **different from any dev/local key**
- [ ] `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASS`: Redis Cloud
- [ ] `JUDGE0_BASE_URL` (TLS or private network) and `JUDGE0_AUTH_TOKEN` (= `AUTHN_TOKEN` in `judge0.conf`); port 2358 closed to the internet
- [ ] `JUDGE0_DEADLINE_MS` set from the capacity test (§8.1); `JUDGE0_TIMEOUT_MS` default 5000
- [ ] `GEMINI_API_KEY` (with a quota/budget alert in Google AI Studio)
- [ ] `CLIENT_URL` = the exact Vercel origin (`https://oncode-self.vercel.app`), no trailing slash
- [ ] `TRUST_PROXY_HOPS` = real proxy count of the host (usually 1); wrong values break per-IP limits
- [ ] `GUEST_MODE_ENABLED=true` (kill switch: `false`)
- [ ] `LOG_LEVEL=info`; remove `USER_ID`
- [ ] Vercel: `VITE_API_URL` = production API origin

### Deploy order

1. Merge and deploy the backend, then the frontend.
2. `cd backend && MONGO_URI=<prod> node scripts/drop-demo-artifacts.js` (dry run), then `--apply`.
3. `node scripts/qa/check-problems.js --env backend/.env` (read-only) must print 75 OK.

### 5-minute post-deploy smoke test

1. `GET <api>/readyz` → 200 `{mongo: ok, redis: ok}`; admin `GET /submission/health` → `isOnline: true`.
2. Open the site logged out: 75 problems, search "sum", filter Hard (7).
3. Continue as Guest → Two Sum → Run the starter (Wrong Answer is fine) → `/profile` asks to sign up → Exit guest.
4. Sign up a throwaway account → paste the reference solution → Submit → Accepted 10/10 → Solution tab unlocks →
   profile shows 1 solved.
5. Ask the AI tutor one question → reply.
6. Log in as admin → dashboard loads → manage problems shows 75 → log out; delete the throwaway account from its profile.

### Pre-push checklist

- [ ] Review the 15 commits on `qa/pre-release` (`git log --oneline main..qa/pre-release`)
- [ ] Decide Q1 and Q2
- [ ] `cd backend && npm run lint && npm test` and `cd frontend && npm run lint && npm test && npm run build` (all green on this branch)
- [ ] Decide what to do with `scripts/qa/` (kept on the branch as QA tooling; `results/` holds this run's evidence)
- [ ] Add `.claude/` to `.gitignore` (or commit `launch.json` deliberately)
- [ ] Move or delete `backend/backups/2026-11-26T06-08-22-559Z/` (production user data on the laptop)
- [ ] Production env checklist above, then deploy order, then smoke test
