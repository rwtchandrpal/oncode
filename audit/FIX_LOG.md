# Fix log: branch `fix/all-phases`

Unattended implementation of `audit/IMPLEMENTATION_PLAN.md` phases A → B1 → B2 → C1 → C2 → D → E1 → E2 → E3 → F.
Phase G (Judge0 re-test) is skipped because Judge0 is off.

## Step 0: setup and baseline (2026-11-25)

- **Repo location:** the session started in `D:\projects\mentora`, which is a different project. Oncode lives in
  `D:\projects\oncode`; all work happened there. `mentora` was not touched.
- **Snapshot:** `CLAUDE.md` and `audit/` were untracked on `main`. They were scanned for secret-shaped strings
  (Atlas/Redis Cloud URIs, Google API keys, JWTs, Judge0 host:port): none found. Committed on `main` as
  `5d849c0 chore: snapshot before fix work` (no `.env`). Then branched `fix/all-phases`.
- **Local stack:** existing containers `oncode-audit-mongo` (Mongo 7 rs0, 127.0.0.1:27018) and
  `oncode-audit-redis` (Redis 7, 127.0.0.1:6380, password `auditpass`) restarted; `node audit/harness/seed.js`
  → 3 users, 12 problems. Backend via `audit/harness/start-backend.sh` (port 3100, local JWT key, Judge0 at closed
  port 2359). dotenv reported only 2 vars injected from `.env` (the non-overridden ones: `GEMINI_API_KEY`, `USER_ID`).
- Reading `backend/.env` directly was refused by the permission system; nothing in this work needed its values.

### Baseline results
| Check | Result |
|---|---|
| Backend boot (local stack) | OK, `Databases are connected successfully`, listening on 3100 |
| `frontend: npm run lint` | 0 problems |
| `frontend: npm run build` | OK in 1.16 s. Largest: vendor-react 257.04 kB (82.58 gz), problemWorkspace 187.21 kB (53.22 gz), schemas 58.72 kB, index.esm 28.40 kB, vendor-ui 37.37 kB, vendor-redux 24.75 kB, CSS 107.47 kB (17.69 gz) |
| `backend: npm audit` (all = prod) | 13: critical 2, high 6, moderate 5 |
| `frontend: npm audit` all | 16: high 12, moderate 3, low 1 |
| `frontend: npm audit --omit=dev` | 11: high 9, moderate 2 |
| Backend tests | none exist |

---
## Phase A: critical security and data exposure (SEC-01, 02, 03, 05, 08, 10, 14)

**What changed**
- A1 deps: backend mongoose 9.13.1, axios 1.21.1, express 5.3.0, express-rate-limit 8.7.5; frontend axios 1.21.1,
  react-router 7.18.7, zod 4.6.7, vite 8.3.8; plus non-force `npm audit fix` for transitive packages (own commit).
- A2 `login`: string-only email/password (400), email trim+lowercase, bcrypt always runs (dummy hash), no
  `err.message`. `mongoose.set('sanitizeFilter', true)` in `config/db.js`.
  - **Deviation from plan:** the plan said "grep confirms no `$` keys are used", but sanitizeFilter applies to *every*
    query filter, and the code does use `$in/$nin/$lt/$ne/$regex` literals (problem list filters, admin counts, demo
    cleanup). Those are now wrapped in `mongoose.trusted()`. Verified: search, topic, difficulty and status filters
    return the same counts as before. Populate is already trusted internally by mongoose.
- A3 new `backend/src/utils/AppError.js` (`AppError`, `Judge0UnavailableError`, `sendError`). The Judge0 client throws
  `Judge0UnavailableError` (503 + generic message, cause logged only). All controller catch blocks return fixed
  messages. `validate.js` throws `AppError(400)` so its user-facing messages stay. `GET /submission/health` is
  behind `adminMiddleware` and returns `{isOnline, code}` only.
- A4 submit returns a whitelisted object; for hidden tests no input/expected/actual and no stderr. `errorMessage` is
  compile output (compile errors) or "`<status>` on hidden test case N." (runtime errors). Full detail is stored in new
  `select:false` fields `failedTestCase` / `errorDetail` (the per-problem submission list also returns
  `errorMessage`, so it had to stay user-safe). `ResultDisplay` shows an explanation instead of the hidden test.
- A5 global `express.json` 100kb, `/problem` 2mb; code > 64,000 chars → 413 before any DB write; body-parser
  errors map to 413/400 in the existing global handler (the full error contract is C1).
- A6 `backend/.env.example`, `frontend/.env.example`, README "Local development stack (Docker)". Separate dev
  credentials → `OWNER_TODO.md`.
- Harness: `audit/harness/mock-judge0.mjs` (verdict chosen by a `MOCK_*` marker in the code) and a
  `JUDGE0_BASE_URL` override in `start-backend.sh` (default stays the closed port 2359). Used only for local
  verification; no real Judge0 was contacted.

**Files:** backend `package*.json`, `src/config/db.js`, `src/controllers/{userAuthenticate,submissionController,problemController,adminController}.js`,
`src/utils/{AppError,judge0Utility,validate,cleanupDemoWorker}.js`, `src/models/submission.js`, `src/routes/submitRoute.js`,
`src/server.js`, `.env.example`; frontend `package*.json`, `src/components/ResultDisplay.jsx`, `.env.example`; `README.md`;
`audit/harness/{mock-judge0.mjs,start-backend.sh}`.

**Acceptance criteria**
| Criterion | Result | Evidence |
|---|---|---|
| `{"email":{"$ne":null},...}` login → 400; regex payloads → 400 | PASS | 5 operator/array payloads all 400; `raw/fixes/phase-a-api-tests-1.txt` |
| Login timing known vs unknown < 20 ms (10 samples) | PASS | 67.7 vs 58.7 ms, diff 9.0 ms |
| `npm audit --omit=dev` 0 critical / 0 high, both apps | PASS | backend 2 moderate (minimatch via nodemon, ip-address), frontend 0 |
| Judge0 off: Run/Submit 503 generic; UI has no IP/port/"judge0"; health as user 403 | PASS | curl 503s; browser text check `{judge0:false, ip:false, port:false}`; `screenshots/fixes/A-run-judge0-off-generic-error.jpg`; health anon 401 / user 403 / admin 503 `{isOnline:false,code}` |
| `grep err.message\|error.message controllers` only console lines | PASS | 2 `console.*` hits + 1 string literal ("...without error message.") matched by the regex dot |
| 100 KB+ code body → 413, submission count unchanged | PASS | 70 K chars, 110 KB, 6 MB bodies → 413 on submit and run; count 6 → 6 |
| Browser: login, signup, workspace, admin still work | PASS | UI signup (new account), admin login via modal, workspace Run, admin dashboard and manage-problems; `screenshots/fixes/A-admin-manage-problems.jpg` |
| SEC-03 (no hidden data in submit responses) | PASS (mock Judge0) | WA/RE(stdin echo)/CE/TLE/AC responses contain no `HIDDEN_*`/`echo:`; DB keeps `errorDetail`/`failedTestCase`. Real-Judge0 check → Phase G |

Note: screenshots from the built-in browser are JPEG, so the files are `.jpg`, not `.png`.

**Commits:** `93c1e7f` deps · `53300df` login/sanitizeFilter · `4bc2dcd` error leakage · `775462b` hidden tests ·
`768d001` payload caps · `02e5115` env examples/README.

---
## Phase B1: backend stability and submission pipeline (BUG-01, 02, 03, 04, 13, 14, 18 backend)

**What changed**
- B1.1 `config/redis.js`: `error` listener (warn, rate-limited to one line per 30 s), `reconnectStrategy`
  `min(retries*200, 5000)`, `connectTimeout 5000`, and `disableOfflineQueue: true` so commands fail fast instead of
  hanging while Redis is down.
- B1.2 boot policy "start anyway": Mongo connect is fatal (`exit 1`), then `listen`, then `client.connect()` in the
  background (non-fatal).
- B1.3 new `utils/tokenBlocklist.js` (`isTokenBlocked` fails open with a warning). All three middlewares use it.
  user/admin middlewares return 401 only for JWT errors and 503 for unexpected errors (e.g. Mongo down).
  Documented risk: during a Redis outage a logged-out token stays valid until it expires (≤ 1 h, demo ≤ 24 h).
- B1.4 + B1.6 (one commit: both rewrite the same lines of `submitCode`/`runCode`): the submission record is created
  only after Judge0 accepts the batch; a polling failure marks it `System Error` / "Execution service unavailable"
  and returns 503. The demo quota is charged after problem and language validation, and `DECR`ed when execution fails.
- B1.5 profile stats and admin dashboard exclude `Pending` and `System Error` (`UNGRADED_STATUSES` exported from the
  submission model). `backend/scripts/mark-stale-pending.js`: dry run by default, `--apply` to write; reads only
  `MONGO_URI` and prints only host/db. Run here against the local Docker DB only.
- B1.7 `judge0Utility`: one deadline (`JUDGE0_DEADLINE_MS`, default 30 s) shared by batch create and polling;
  per-request timeout `JUDGE0_TIMEOUT_MS` default lowered to 5 s; expiry → `Judge0UnavailableError` (503). Reported
  runtime is the slowest test (was the sum, BUG-18).
- Harness: `api-tests-2.mjs` crashed once no submission is stored (it read `[0].l` of an empty aggregate). Patched to
  `?.l ?? 0`; it only affects the report line.

**Acceptance criteria**
| Criterion | Result | Evidence |
|---|---|---|
| `docker stop` Redis while running: process up, `GET /problem/` 200, `/user/check` 200 (fail-open, warning logged), recovers on `docker start` | PASS | `/problem/` 200, `/user/check` 200, `/user/profile` 200, admin-as-user 403; warnings `[auth] token blocklist check skipped`; after start `[redis] ready`, logout+revocation works again. `raw/fixes/B1-redis-outage.log` |
| Boot with Redis stopped: listens, never hangs | PASS | listening in ~2 s, then `Redis connected` when the container started. `raw/fixes/B1-boot-without-redis.log` |
| Judge0 off: Submit 503, Pending count 0, Submissions tab has no new Pending, profile total unchanged | PASS | 3 submits → 503, `countDocuments({status:'Pending'})` 0 → 0, profile total 0 → 0; browser Submissions tab "You have not submitted any code" (`screenshots/fixes/B1-submit-judge0-off-no-pending.jpg`) |
| Demo user: 25 failed runs not rate-limited by the quota | PASS | 25 × 503, no 429; `demo_runs` counter back at 0 |
| `api-tests-2.mjs` Pending line shows 0 new records | PASS | `raw/fixes/phase-b1-api-tests-2.txt`: "after one failed submit: 0", "demo user 21st run -> 503" |
| Poll failure after Judge0 accepted → `System Error`, not Pending (mock) | PASS | `MOCK_DOWN_ON_POLL` and `MOCK_PROCESSING` (deadline 6 s → 503 in 4.1 s) both stored `System Error` |
| Stats exclusion | PASS | DB with 1 Accepted, 1 System Error, 2 Pending → profile total 1 / rate 100; dashboard total 1 |

**Commits:** `1da2503` redis listener · `1105ca2` boot policy · `5e65722` middleware fail-open · `1b5b687` no Pending
+ demo quota · `4a11b8e` stats + cleanup script · `6dce081` Judge0 deadline.

---
