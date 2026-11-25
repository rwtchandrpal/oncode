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
## Phase B2: frontend session and workspace state (BUG-05, 06, 07, 08, 18 frontend)

**What changed**
- B2.1 `authSlice`: new `sessionCleared` reducer; `logoutUser.rejected` now clears `user`/`isAuthenticated`.
- B2.2 `axiosClient` (own commit `fb41a00`): `setupInterceptors(store, {sessionCleared, openAuthModal})` called from
  `main.jsx`. On a 401 (except `/user/login|register|demo|logout`) it removes the token, dispatches `sessionCleared`
  and opens the auth modal with `redirectPath = location.pathname` (not for the boot-time `/user/check`, which
  `checkAuth` handles). `/submission/*` requests get a 60 s timeout and a friendly `error.userMessage`.
- B2.3 `UserProfile` delete: removes the token and does a hard `window.location.replace('/')`, with no logout call.
  First attempt (`navigate('/')` + `dispatch(sessionCleared())`) landed signed out but re-opened the sign-in modal,
  because the Redux update renders before react-router's transition and `ProtectedRoute` redirects with
  `openAuthModal`. The hard redirect fixes that (follow-up commit `c47af32`).
- B2.4 `ProblemCodeEditor` takes `path` + `defaultValue` (one Monaco model per `problemId-language`) instead of
  a controlled `value`; `handleCodeChange` reads the language from a ref.
- B2.5 workspace `loadError` state: 400/404 → "Problem not found" + "Back to problems"; other errors → Retry.

**Acceptance criteria**
| Criterion | Result | Evidence |
|---|---|---|
| Garbage `localStorage.token`, click "View Profile": modal opens, navbar shows "Get Started", no zeros page | PASS | `{dialogOpen:true, getStarted:true, path:'/', token:null}`; logging in from that modal lands on `/profile` with real data. `screenshots/fixes/B2-garbage-token-auth-modal.jpg` |
| Expired token (signed with the local harness key, exp −1 h) | PASS | API 401 "Your session has expired"; in the UI the next request signs out and opens the modal |
| Logout | PASS | lands on `/`, token removed, old token → 401 on `/user/check`, no stray modal |
| Delete a throwaway account → `/` signed out | PASS | `{path:'/', token:null, modalOpen:false, getStarted:true}`; `screenshots/fixes/B2-after-account-delete.jpg` |
| Edit C++, switch to Java, edit Java, switch back: both edits survive (`monaco.editor.getEditors()[0].getValue()`) | PASS | cppBack starts `// CPP EDIT`, javaBack starts `// JAVA EDIT` |
| `/problem/not-a-real-id` and `/problem/000000000000000000000000` show "Problem not found" within 2 s | PASS | both pages show the message at the 2 s check; `screenshots/fixes/B2-problem-not-found.jpg` |
| `npm run lint` passes; `npm run build` succeeds | PASS | after every task |

Observed during testing: with an expired token the workspace still rendered the problem from the **browser cache**
(`Cache-Control: public, max-age=120` on `GET /problem/:id`). That is SEC-13; it is fixed in Phase D.

**Commits:** `788b1a8` sessionCleared · `fb41a00` interceptor + timeout · `16fedeb` delete clears session ·
`3dd983a` per-language models · `fec7fbb` problem not found · `c47af32` delete hard-redirect.

---
## Phase C1: input validation and error contract (BUG-11, 12, 17, CQ-02, 04, 06, SEC-11)

**What changed**
- C1.1 `backend/src/config/env.js`: zod schema for every variable in CLAUDE.md, plus the new optional
  `JUDGE0_DEADLINE_MS`, `TRUST_PROXY_HOPS` (default 0) and `LOG_LEVEL`. It is required first in `server.js`;
  failures print `Missing env: A, B` / `Invalid env: C` (names only) and exit 1. `GEMINI_API_KEY` is required.
- C1.5 (done before C1.2 because `sendError` logs) `utils/logger.js` (pino) + `pino-http` with redaction of
  `req.headers.authorization`, cookies, `password`, `token`. Every `console.*` in `backend/src` was replaced, except
  in `env.js`, which runs before the logger exists. New deps: `zod@^4.6.7`, `pino@^9.14`, `pino-http@^10.5`.
- C1.2 error contract `{ error: { code, message } }`: `AppError`/`sendError`/`errorBody`, an `errorShape` middleware
  that normalizes legacy `{message}` / `{error:"..."}` bodies (controllers, middlewares, rate limiters), a central
  handler (malformed JSON 400 `INVALID_JSON`, too large 413, AppError, else 500) and a 404 route handler. Extra fields
  are kept next to `error` (`isLocked` on the solution 403, `details` on validation errors). Frontend reads messages
  via the new `frontend/src/utils/apiError.js` (all `response.data.message` reads replaced) in the same commit.
- C1.3 `middlewares/validate.js` + `backend/src/validation/{common,auth,problem,submission,ai}.js`, applied to
  every endpoint in AUDIT_REPORT §4 that takes input:
  register/admin-register (strict bodies, email normalized, password 8+ with classes and ≤ 72 bytes, lastName
  optional, role enum), login (strings, length-capped), problem list query (single strings, enums, page ≥ 1,
  limit ≤ 100 or `all` until Phase D), ObjectId params on all `/:id` routes, problem create/update (typed fields,
  unknown keys stripped, so `number`/`problemCreator` cannot be set), submit/run (`code` string, `language`
  enum; the 64,000-char cap stays a 413 in the controller), AI doubt (typed and length-capped, rejected not
  truncated, validated before the AI limiter). `utils/validate.js` was removed.
  To keep the chat working, its input got `maxLength={1000}` and it now shows the server's message.
  Behaviour change: register with an extra `role` key is now 400 (strict body); it was silently ignored before.
- C1.4 frontend `authSchemas.js`: firstName min 1, lastName optional, password ≤ 72 bytes, email ≤ 254; signup
  placeholder "Last Name (optional)".

**Acceptance criteria**
| Criterion | Result | Evidence |
|---|---|---|
| `api-tests-1.mjs`: `?search=a&search=b`, `/problem/submissions/not-an-id`, `submit/not-an-id`, language object, malformed JSON → 400 (were 500) | PASS | `raw/fixes/phase-c1-api-tests-1.txt` |
| numeric `userQuestion` → 400 | PASS | `raw/fixes/phase-c1-extra-checks.txt` (no Gemini call made) |
| 6 MB body → 413 | PASS | `/user/login` and `/problem` (2 MB parser) both 413 |
| Every error body matches `{error:{code,message}}` | PASS | scan of every 4xx/5xx line in the api-tests-1 output, plus 404 route, 429 limiter, 403 with `isLocked`, 503 Judge0 |
| `JWT_KEY` unset → `Missing env: JWT_KEY`, exit 1 | PASS | `raw/fixes/C1-missing-jwt-key.txt` |
| 200 KB password at register → 400 | PASS with note | A 200 KB body now hits the Phase A 100 KB cap first and gets **413**. Passwords from 73 bytes to 90 KB get **400** "Password cannot be longer than 72 bytes" |
| Frontend flows still work after the schemas | PASS | browser: signup with empty last name; wrong-password login shows "Invalid credentials."; earlier flows. API: UI-shaped admin create/update payloads pass validation (stop at Judge0 503), admin user registration with empty lastName 201, Home list params 200 |

**Commits:** `2268d43` env · `528c832` logging · `1b03327` error contract · `5484103` validation · `f3eb6df` frontend
schemas · `99d17c4` required-field messages.

---
## Phase C2: platform hardening (SEC-04, 06, 07, 09, 12, OPS-01, 02)

**What changed**
- C2.1 `app.disable('x-powered-by')`, `helmet()` (with `crossOriginResourcePolicy: cross-origin`, since the SPA
  calls the API cross-origin), `app.set('trust proxy', env.TRUST_PROXY_HOPS)`, default 0. Deps: `helmet@^8.3`,
  `rate-limit-redis@^4.3`.
- C2.2 `middlewares/rateLimits.js`: every limiter uses a Redis store (`rl:<name>:` keys) with
  `passOnStoreError: true` (fail open during a Redis outage). The store's eager Lua-script load rejects when
  Redis is not yet connected (our boot policy); those early rejections are swallowed and the store reloads the
  scripts on first use. Without that they would be unhandled rejections. Limits: register 10/15 min/IP; login
  5 failed/15 min per (IP, email) (`skipSuccessfulRequests`) plus 50/15 min/IP; demo 5/15 min/IP; submit+run
  50/15 min/IP; AI 10/10 min/user plus 20/10 min/IP.
- C2.3 `/chatAI/doubt` takes `problemId`; title and description are loaded from MongoDB (client copies ignored).
  Demo sessions get 3 AI questions per 24 h (`demo_ai:<id>` in Redis, fails open), refunded when Gemini fails.
  Upstream Gemini 429/503 → 503 "The AI tutor is busy" (one such upstream 503 happened during the test).
- C2.4 `frontend/src/utils/monacoSetup.js`: Monaco from npm (`monaco-editor@^0.58.0`, the version already
  installed as the loader's peer), editor core + C++/Java tokenizers + editor worker, `loader.config({ monaco })`.
  `vendor-monaco` chunk (2.82 MB / 726 kB gzip, lazy with the workspace; Vite warns about its size).
  `vercel.json` headers: CSP `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; worker-src 'self' blob:;
  object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, plus nosniff, Referrer-Policy,
  X-Frame-Options DENY, Permissions-Policy. `style-src 'unsafe-inline'` is needed because Monaco sets inline
  styles. `connect-src https:` is used because the production API host is not in the repo; tightening it to the
  real host is an owner step. `vite preview` serves the same headers (+ the local API origin) so the CSP was
  tested on the production build. It worked on the first attempt, so no relaxation was needed.
- C2.5 `routes/healthRoutes.js`: `GET /healthz` (always 200) and `GET /readyz` (Mongo `ping` + Redis `PING`, 2 s
  timeout each, 503 otherwise); probes are excluded from request logs.
- C2.6 SIGTERM/SIGINT → `server.close` → Redis `close` → `mongoose.disconnect` → exit 0 (10 s watchdog → exit 1);
  `unhandledRejection` is logged.
- C2.7 Judge0 TLS / token rotation: infra only → `OWNER_TODO.md`.

**Acceptance criteria**
| Criterion | Result | Evidence |
|---|---|---|
| `curl -I /problem/`: no `X-Powered-By`, helmet headers present | PASS | `raw/fixes/C2-headers.txt` (CSP, HSTS, nosniff, X-Frame-Options, Referrer-Policy, COOP) |
| Vercel preview responses include the CSP header | PASS locally / DEFERRED on Vercel | `vite preview` (same header set from `vercel.json`) returns the CSP. Vercel itself was not touched (owner check) |
| 6 wrong logins for one email → 429 for that email only; another email from the same IP still logs in | PASS | `401×5, 429`; other@ → 200 (`raw/fixes/C2-rate-limits.txt`) |
| Restarting the backend does not reset limiter counters | PASS | after restart the same email still got 429 |
| No `cdn.jsdelivr.net` in the workspace resource list; editor works, including offline | PASS | production build under CSP: resources only `vendor-monaco-*.js/.css` from our origin, editor renders, typing works, Java switch highlights, `MonacoEnvironment.getWorker()` starts a worker with 0 CSP violations. Nothing is fetched from any external host, so the editor does not need network beyond our origin. `screenshots/fixes/C2-monaco-selfhosted-under-csp.jpg` |
| `/healthz` 200 always; `/readyz` 503 with Redis stopped | PASS | `raw/fixes/C2-health.txt` |
| `kill -TERM <pid>` → clean shutdown, exit 0 | PASS (Linux container) | Windows cannot deliver SIGTERM to a handler (Node terminates immediately), so this ran in `oncode-api:local` built from the new `backend/Dockerfile` on a Docker network with the local Mongo/Redis: "Shutting down SIGTERM" → "Shutdown complete" in 8 ms, exit 0 (`raw/fixes/C2-sigterm.txt`) |
| Redis down: limiters fail open | PASS | login and `/problem/` 200 with Redis stopped |
| AI: client title ignored; demo quota | PASS | reply "Double It" despite `problemTitle: CLIENT_TITLE_INJECTION`; 4th demo question 429 (`raw/fixes/C2-ai-cost-controls.txt`) |

**Commits:** `30e79e1` helmet/trust proxy · `d1c38c4` rate limits · `0d5c318` AI cost controls · `cea9721` Monaco + CSP ·
`77824cb` health · `93d1ed9` shutdown.

---
