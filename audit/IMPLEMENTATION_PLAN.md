# Oncode implementation plan

Ordered by risk. Each phase is sized for **one Claude Code session and one reviewable PR**, with one concern per
commit. Finding IDs refer to `AUDIT_REPORT.md` / `FINDINGS.csv`.

**Ground rules for every phase**
- Work on a branch `fix/<phase>`; never commit `.env`; never point at Atlas or Redis Cloud while developing.
- Local stack: `audit/harness/README.md` (Docker Mongo + Redis, `seed.js`, `start-backend.sh`, frontend on :5174).
- Re-run the relevant `audit/harness/api-tests-*.mjs` and compare with `audit/raw/` to prove the fix.
- Update `audit/PROGRESS.md` (add a "Fix phases" table) at the end of each phase.

---

## Phase A: Critical security and data-exposure fixes
**Goal:** close the exploitable auth hole, patch vulnerable dependencies, and stop leaking hidden tests and infrastructure details.
**Resolves:** SEC-01, SEC-02, SEC-03, SEC-05, SEC-08, SEC-10, SEC-14 · **Effort:** M (1 session) · **Depends on:** none

Tasks (in order):
1. **Deps (SEC-02):** in `backend/`, `npm i mongoose@^9.13.1 axios@^1.21.1 express@^5.3.0 express-rate-limit@^8.7.5`. In `frontend/`, `npm i axios@^1.21.1 react-router@^7.18.7 zod@^4.6.7 && npm i -D vite@^8.3.8`. Run `npm audit`; only `--force` if reviewed. Smoke-test boot and build.
2. **Login hardening (SEC-01, SEC-10):** `backend/src/controllers/userAuthenticate.js` `login`:
   - Reject non-string `email`/`password` with 400.
   - Normalize the email (`trim().toLowerCase()`).
   - Always run `bcrypt.compare` (dummy hash when no user).
   - Return 401 "Invalid credentials." without `err.message`.
   - In `backend/src/config/db.js`, add `mongoose.set('sanitizeFilter', true)` before `connect`.
3. **Error leakage (SEC-05):** replace every `"...: " + err.message` in controllers with fixed messages and log server-side. Judge0 failures return **503** `{message:"Code execution is temporarily unavailable. Please try again later."}`. Make `GET /submission/health` admin-only (`adminMiddleware`) or reduce it to `{ok}`.
4. **Hidden tests (SEC-03):** `submissionController.js` `submitCode`:
   - For hidden-test failures, stop returning `failedTestCase.input/expectedOutput`. Return `{status, testCasesPassed, testCasesTotal, runtime, memory}` plus, for compile errors only, `compile_output`.
   - For runtime errors on hidden tests, return a generic message (no stderr).
   - Keep full detail in the DB for admins only, and make sure the response never echoes it.
   - Update `frontend/src/components/ResultDisplay.jsx` to handle the missing fields.
5. **Payload caps (SEC-08):** `server.js` `express.json({limit:'100kb'})` globally; mount a `2mb` parser only on `POST/PUT /problem`. In submit/run, reject `typeof code !== 'string' || code.length > 64_000` with 413 **before** any DB write.
6. **Dev/prod separation (SEC-14):** add `backend/.env.example` (from `audit/proposed-env/`) and `frontend/.env.example`; document the local Docker stack in the README. Ask the owner to create separate dev credentials (manual step, not code).

Acceptance criteria:
- `curl -X POST localhost:3100/user/login -d '{"email":{"$ne":null},"password":"AuditAdmin#2026"}' -H 'Content-Type: application/json'` gives **400**. Regex payloads give 400.
- Login timing for unknown vs known email differs by < 20 ms (10-sample average).
- `npm audit` shows 0 critical and 0 high in production deps (`npm audit --omit=dev`) for both apps.
- With Judge0 off, Run/Submit respond **503** with the generic message. The UI error panel contains no IP, port or "judge0" string. `GET /submission/health` as a normal user gives 403.
- `grep -rn "err.message\|error.message" backend/src/controllers` shows only `console`/logger lines.
- A 100 KB+ code body gives 413 and `db.submissions.countDocuments()` is unchanged.
- Browser: login, signup, workspace and admin still work (repeat the Phase 3 flows quickly).

Risks / rollback: dependency bumps could change behaviour (mongoose 9.3→9.13, react-router 7.14→7.18). Do them in their own commit so they revert independently. `sanitizeFilter` also rejects legitimate `$` keys in filters; grep confirms none are used.

---

## Phase B1: Backend stability and submission-pipeline correctness
**Goal:** the API survives Redis blips, never stores a false verdict or orphaned record, and stats stay truthful.
**Resolves:** BUG-01, BUG-02, BUG-03, BUG-04, BUG-13, BUG-14, BUG-18 (backend part) · **Effort:** M · **Depends on:** A (error-message helper)

Tasks:
1. `backend/src/config/redis.js`: add `client.on('error', …)` (warn-level log) and `socket.reconnectStrategy: retries => Math.min(retries * 200, 5000)` (BUG-02).
2. `backend/src/server.js`: decide boot policy (BUG-03). Recommended: connect Mongo (fatal → `process.exit(1)`), start `listen`, connect Redis in the background (non-fatal). If you prefer strict, `process.exit(1)` in the catch.
3. `middlewares/userMiddleware.js` and `adminMiddleware.js`: wrap `client.exists` in try/catch and fail open with a warning, as `optionalUserMiddleware` does. Distinguish JWT errors (401) from unexpected errors (503) (BUG-04).
4. `submissionController.js` `submitCode` (BUG-01, BUG-13):
   - Wrap the Judge0 section in try/catch. On failure set `status:'System Error'`, `errorMessage:'Execution service unavailable'`, save it (or delete the doc), and return 503.
   - Better ordering: create the record only after Judge0 accepts the batch.
5. `userAuthenticate.js` `getUserStats` and `adminController.js`: count only graded statuses (`status: {$nin: ['Pending','System Error']}`) (BUG-13). One-off migration script `audit/harness/` or `backend/scripts/` to mark existing `Pending` older than 10 min as `System Error`.
6. Demo quota (BUG-14): move `checkDemoExecutionLimit` after problem and language validation; `DECR` the key when Judge0 fails.
7. `utils/judge0Utility.js` (BUG-18): add an overall deadline (for example 30 s) across create and poll; reduce the per-request timeout to 5 s; on deadline throw a typed `Judge0UnavailableError`.

Acceptance criteria:
- `docker stop oncode-audit-redis` while the backend runs: the process stays up; `GET /problem/` gives 200; authenticated `GET /user/check` gives 200 (fail-open) with a warning in the log; `docker start` recovers without restart.
- Boot with Redis stopped: the server listens (or exits non-zero if the strict policy is chosen), never hangs.
- With Judge0 off: Submit gives 503, and `db.submissions.find({status:'Pending'}).count()` is **0** afterwards. The Submissions tab shows no new Pending entry. Profile `totalSubmissions` is unchanged.
- A demo user with Judge0 off can make 25 failed runs and is not rate-limited by the demo quota.
- Re-run `audit/harness/api-tests-2.mjs`: the Pending line now shows 0 new records.

Risks / rollback: failing open on Redis means a logged-out token stays valid during a Redis outage (≤ 1 h). That's acceptable; document it. Each task is a separate commit.

---

## Phase B2: Frontend session and workspace state bugs
**Goal:** the UI always reflects the real session, and editor work is never silently lost.
**Resolves:** BUG-05, BUG-06, BUG-07, BUG-08, BUG-18 (frontend timeout) · **Effort:** S–M · **Depends on:** none (parallel with B1)

Tasks:
1. `features/auth/authSlice.js`: add a `sessionCleared` reducer. Make `logoutUser.rejected` also clear `user`/`isAuthenticated` (BUG-08).
2. `utils/axiosClient.js`: on 401 (excluding `/user/login` and `/user/register`), remove the token **and** dispatch `sessionCleared` plus `openAuthModal({redirectPath: location.pathname})`. Use an injected store reference (`setupInterceptors(store)` called in `main.jsx`) to avoid a circular import (BUG-07). Add `timeout: 60000` for `/submission/*` calls with a friendly timeout message (BUG-18).
3. `pages/UserProfile.jsx` `handleConfirmDelete`: after a successful DELETE, `localStorage.removeItem('token')`, dispatch `sessionCleared`, then navigate to `/` (no logout API call) (BUG-08).
4. `pages/problemWorkspace/problemWorkspace.jsx` (BUG-05): track `selectedLanguage` in a ref used by `handleCodeChange`. Better still, render `<Editor path={`${problemId}-${lang}`} defaultValue=...>` so Monaco keeps one model per language.
5. Same file (BUG-06): add `loadError` state; on 400/404 render "Problem not found" with a link to `/`; on other errors render a retry button.

Acceptance criteria (browser, local stack):
- Log in, set `localStorage.token` to garbage, click "View Profile": the auth modal opens, the navbar shows "Get Started", and no zeros-stats page appears.
- Delete a throwaway account: you land on `/` signed out.
- In the workspace, edit C++, switch to Java, edit Java, switch back: both edits survive (check with `monaco.editor.getEditors()[0].getValue()`).
- `/problem/not-a-real-id` and `/problem/000000000000000000000000` show "Problem not found" within 2 s.
- `npm run lint` passes; `npm run build` succeeds.

Risks / rollback: the interceptor change touches every request. Keep it in one isolated commit.

---

## Phase C1: Input validation and error contract
**Goal:** every endpoint validates its input and returns a consistent, non-leaky error shape. Config is validated at boot.
**Resolves:** BUG-11, BUG-12, BUG-17, CQ-02, CQ-04, CQ-06, SEC-11 · **Effort:** M · **Depends on:** A, B1

Tasks:
1. `backend/src/config/env.js`: zod schema for all env vars (names in `CLAUDE.md`); import first in `server.js`; exit with a list of missing names (never values) (CQ-02).
2. `backend/src/utils/AppError.js` plus a central error handler in `server.js`: map `entity.parse.failed` → 400 and `entity.too.large` → 413; unknown errors → 500 `{error:{code,message}}`. Switch the AI route from `{error}` to the same shape (BUG-11, CQ-04).
3. `backend/src/middlewares/validate.js`: a `validate({body, params, query})` middleware using zod. Schemas in `backend/src/validation/`: auth (login, register with password max 72 bytes), problem list query (strings only, `limit` ≤ 100), ObjectId params, submit/run (`code` string ≤ 64 KB, `language` enum `cpp|java`), AI doubt (strings, length caps). Apply to every route in the endpoint table (BUG-12, SEC-11).
4. Align `frontend/src/validations/authSchemas.js` with the backend rules (firstName min 1 or backend min 2, lastName optional, password ≤ 72) (BUG-17).
5. Logging (CQ-06): add `pino` + `pino-http` with `redact: ['req.headers.authorization']`; replace `console.*`.

Acceptance criteria:
- Re-run `api-tests-1.mjs`. These now return **400** instead of 500: `?search=a&search=b`, `/problem/submissions/not-an-id`, `submit/not-an-id`, language object, malformed JSON, numeric `userQuestion`. A 6 MB body gives 413.
- Every error body matches `{error:{code,message}}`.
- Starting with `JWT_KEY` unset prints `Missing env: JWT_KEY` and exits 1.
- A 200 KB password at register gives 400.

Risks / rollback: stricter validation can reject requests the current frontend sends (for example empty `lastName`). Run the browser flows after each schema.

---

## Phase C2: Platform hardening
**Goal:** reduce blast radius and abuse cost.
**Resolves:** SEC-04, SEC-06, SEC-07, SEC-09, SEC-12, OPS-01, OPS-02 · **Effort:** M · **Depends on:** C1

Tasks:
1. `server.js`: `app.disable('x-powered-by')`, `helmet()`, `app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 0))` (add to the env schema) (SEC-12, SEC-09).
2. Rate limits (SEC-09, SEC-06):
   - Separate `registerLimiter` and `loginLimiter` (key `ip+email`, 5/15 min per email).
   - Add `rate-limit-redis` store for all limiters.
   - Add a per-IP AI limiter (for example 20/10 min) plus a demo AI quota (3/day in Redis).
3. `chatWithAI.js` (SEC-06): accept `problemId` instead of title/description; load them server-side (also removes client-controlled prompt context).
4. Monaco (SEC-07): `frontend/src/components/ProblemCodeEditor.jsx` uses `loader.config({ monaco })` with the npm `monaco-editor` package (self-hosted, bundled lazily). Add `frontend/vercel.json` `headers` with CSP (`script-src 'self'`), `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'` (SEC-12).
5. Health (OPS-01): `GET /healthz` (200) and `GET /readyz` (Mongo `admin().ping()` + Redis `PING`). Leave the Judge0 check admin-only.
6. Shutdown (OPS-02): `SIGTERM`/`SIGINT` → `server.close()`, `client.quit()`, `mongoose.disconnect()`, exit within 10 s. Log `unhandledRejection`.
7. Judge0 TLS (SEC-04, infra plus env only): put Caddy/nginx with TLS in front of Judge0 on EC2, or restrict the security group to the backend egress IP; change `JUDGE0_BASE_URL` to `https://`; rotate `JUDGE0_AUTH_TOKEN`. This is an infra step done by the owner; the code needs no change beyond env.

Acceptance criteria:
- `curl -I localhost:3100/problem/` shows no `X-Powered-By` and includes helmet headers. Vercel preview responses include the CSP header.
- 6 wrong logins for one email give 429 for that email only; another email from the same IP still logs in.
- Restarting the backend does not reset limiter counters (Redis store).
- The browser resource list on the workspace contains no `cdn.jsdelivr.net` entries; the editor still works, including offline.
- `/healthz` gives 200 always; `/readyz` gives 503 with Redis stopped.
- `kill -TERM <pid>` logs a clean shutdown with exit code 0.

Risks / rollback: CSP can break Monaco workers. Test the editor in the built preview (`vite build && vite preview`) before merging. `trust proxy` must match the real host's hop count; a wrong value lets clients spoof IPs. Ship it behind the env var.

---

## Phase D: Performance and data layer
**Goal:** bounded queries and lighter payloads.
**Resolves:** PERF-01, PERF-02, PERF-03, PERF-05, SEC-13, BUG-16 · **Effort:** S–M · **Depends on:** C1

Tasks:
1. `problemController.getAllProblems`:
   - Default `limit=20`, max 100.
   - Remove the 1000-row unbounded path, or allow it only for admins.
   - Cache `allTopics` in Redis (`topics:v1`, invalidate in create/update/delete).
   - Filter difficulty by exact canonical value (`Easy|Medium|Hard`).
   - Add `isSolved` per row when a user is present (PERF-01, PERF-05).
2. `frontend/src/pages/Home.jsx`: drop the `/problem/solved` call and use `isSolved`. `ManageProblems.jsx`: paginate.
3. Submissions (PERF-02): list endpoint without `code`, paginated (`?page&limit=20`); new `GET /submission/:id` (owner-scoped) for details. Update `ProblemSubmissions.jsx` to fetch code on expand.
4. `getProblem` cache header → `private, max-age=60` (SEC-13).
5. `models/problem.js`: replace the max+1 numbering with a `counters` collection and `findOneAndUpdate({$inc:{seq:1}},{upsert:true,new:true})` (BUG-16).
6. `App.jsx`: lazy-load `AuthModal` (render only when `authModal.isOpen`) (PERF-03).

Acceptance criteria:
- `GET /problem/` without params returns ≤ 20 rows plus pagination metadata.
- Home makes exactly one API call per filter change (Network panel).
- Submission list JSON has no `code` field; expanding a row fetches it.
- `vite build`: the initial route chunk set no longer includes `schemas-*.js` or `index.esm-*.js` until the modal opens.
- Creating two problems concurrently (`Promise.all` of two direct model saves in a script) yields numbers n and n+1, with no E11000.

Risks / rollback: response-shape changes on `/problem/` and submissions require coordinated frontend changes. Ship backend and frontend in the same PR.

---

## Phase E1: Admin problem authoring
**Goal:** admins can actually manage what the README promises, without Judge0 blocking metadata edits.
**Resolves:** BUG-09, BUG-10 · **Effort:** M–L · **Depends on:** C1

Tasks:
1. `problemController.updateProblem`: compute changed keys; call `validateAndTestProblem` only if `hiddenTestCases`, `codeSnippets`, `referenceSolutions` or `visibleTestCase` changed.
2. `validateAndTestProblem`: validate **every** reference solution against its matching driver; require one snippet per declared language.
3. Extract a shared `ProblemForm` component from `CreateProblem.jsx`. Support a snippet and solution per language (field arrays keyed by language). Use it in `UpdateProblem.jsx` (prefill from a new admin-only `GET /problem/:id/admin` that includes hidden tests, driver code and solutions).
4. `problemWorkspace.jsx`: derive `languages` from `problem.codeSnippets`; default to the first available.

Acceptance criteria:
- With Judge0 off, editing only the title succeeds (200) and the new title shows on the user list within one refresh. Editing a hidden test case gives 503 (validation needs Judge0).
- A C++-only problem shows only C++ in the workspace language dropdown.
- `GET /problem/:id/admin` gives 403 for a normal user.

Risks / rollback: the admin-only endpoint returns hidden tests, so it must sit behind `adminMiddleware`. Add a test for that in Phase F.

---

## Phase E2: UX and accessibility
**Goal:** readable statements, accessible auth, no dead ends.
**Resolves:** UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, BUG-15 · **Effort:** M · **Depends on:** B2

Tasks:
1. `npm i -D @tailwindcss/typography`; add `@plugin "@tailwindcss/typography";` to `index.css`. Remove `whitespace-pre-wrap` from the markdown wrapper in `ProblemDescription.jsx`. Optional: `remark-math` + `rehype-katex` (UX-01).
2. `AuthModal.jsx`: use `<dialog>` with `showModal()` or `focus-trap-react`; autofocus the first input; restore focus on close; add `<label className="sr-only">` for each input (UX-02).
3. Admin forms: give each input an `id` and its label a `htmlFor`; add `aria-label` to the code textareas (UX-03).
4. `Home.jsx`: wrap in `<main>` with a visually-hidden `<h1>Problems</h1>`; `GlobalNavbar` gets `<nav>`; the 404 page gets a "Back to problems" link (UX-04).
5. Workspace: persist code per `problemId:language` in `localStorage` (debounced 500 ms); add a "Reset to starter code" button with confirm (UX-05).
6. `Home.jsx`: sync `page`, `search`, `difficulty`, `topic`, `status` with `useSearchParams` (UX-06). Topic badges either link to `/?topic=X` or lose `cursor-pointer` (UX-07). Add an error state with retry (BUG-15).

Acceptance criteria:
- The problem statement shows a styled `h3`, bullets and a bordered table (compare with `audit/screenshots/03-problem-markdown-unstyled.jpg`).
- Opening the auth modal moves focus into it; Tab cycles within it; Esc closes it and returns focus to "Get Started".
- `/?page=2&difficulty=hard` reloads to the same view.
- Reloading the workspace keeps edited code; Reset restores the snippet.
- Stopping the backend and reloading Home shows "Couldn't load problems. Retry".

---

## Phase E3: Cleanup and docs
**Goal:** less code, accurate docs.
**Resolves:** SEC-15, CQ-03, CQ-05, CQ-07 (partial), OPS-03 · **Effort:** S–M · **Depends on:** B2, C1 (touches the same middlewares)

Tasks:
1. Merge the three JWT middlewares into `middlewares/authenticate.js` exporting `requireUser`, `requireAdmin`, `optionalUser` (CQ-03).
2. Remove `pages/authentication/Login.jsx` and `Signup.jsx`; route `/login` and `/signup` to `/` with the modal open in the right mode (CQ-03).
3. Move `encodeBase64`/`decodeBase64` to `utils/base64.js`, and `getDifficultyColor` to `frontend/src/utils/difficulty.js` (CQ-03).
4. Remove `cookie-parser` and CORS `credentials:true`; move `nodemon` to devDependencies; delete the stray root `node_modules/` and empty `docs/` (owner confirmation); drop `USER_ID` from `.env` (SEC-15, CQ-05).
5. Extract `services/judgeService.js` (submit, run and problem validation share it) (CQ-07).
6. README: real clone URL, full env list (link to `.env.example`), demo mode, the actual admin feature set, the backend host and deploy notes, the local Docker dev stack (OPS-03).

Acceptance criteria: `npm ls cookie-parser` is empty; `grep -rn "jwt.verify" backend/src` shows 1 hit; all Phase 3 browser flows pass; README env list matches `config/env.js`.

---

## Phase F: Tests and CI
**Goal:** lock in the fixes.
**Resolves:** CQ-01, OPS-04 · **Effort:** M–L · **Depends on:** A–C (tests target the fixed behaviour)

Tasks:
1. Backend: `vitest` (or jest) + `supertest` + `mongodb-memory-server` + `ioredis-mock`/real Redis service in CI. Export `app` from `server.js` separately from `listen`.
2. Tests (minimum):
   - Auth: register, login, NoSQL payloads → 400, logout revocation.
   - Authorization matrix: every admin route as user gives 403 and as anon gives 401.
   - Data exposure: no `hiddenTestCases`, `driverCode` or `referenceSolutions` in non-admin responses (marker strings, as in `seed.js`).
   - Submit with a mocked Judge0: Accepted, Wrong Answer (no hidden data in response), compile error, Judge0 down → 503 and no Pending.
   - Stats exclusion.
3. Frontend: `vitest` + `@testing-library/react` for `authSlice` (logout rejected clears state), the axios 401 interceptor, and the workspace language-switch buffer logic.
4. `backend` ESLint (flat config, `eslint-plugin-n`), Prettier for both apps.
5. `.github/workflows/ci.yml`: Node 22; `npm ci`, lint, test, `npm audit --omit=dev --audit-level=high`, frontend build. Add a `backend/Dockerfile` (OPS-04).

Acceptance criteria: CI green on the PR; coverage reported for `controllers/` and `middlewares/` (target ≥ 60 % lines); deliberately reverting the SEC-01 fix makes a test fail.

---

## Phase G: Re-test with Judge0 (run once Judge0 is turned back on)
**Goal:** verify every Judge0-dependent path, and decide on the async pipeline.
**Resolves:** verification of SEC-03, SEC-04, BUG-01, BUG-09, BUG-10, BUG-14, BUG-18; decision on PERF-04 · **Effort:** M · **Depends on:** A–E1

Tasks:
1. Work through the checklist in `AUDIT_REPORT.md` §7 against a **staging** backend (local stack plus the real Judge0 over TLS). Record results in `audit/JUDGE0_RETEST.md`.
2. Measure Submit p50/p95 for 2, 10 and 50 tests. If p95 > 10 s or concurrency issues appear, implement PERF-04: BullMQ queue on Redis plus Judge0 `callback_url`, `POST /submission` returns `{id}`, and the client polls `GET /submission/:id`.
3. Confirm the SEC-03 behaviour with a stdin-echo program on a hidden test (expect no hidden input in the response).

Acceptance criteria: every §7 item is checked or has a filed follow-up; there is a written latency table; there is a decision record for PERF-04.

---

## Recommended order of execution

1. **A**: security (do first; smallest change with the biggest risk reduction)
2. **B1** and **B2**: can run in parallel (backend vs frontend files)
3. **C1**, then **C2**
4. **D**
5. **E1**, **E2**, **E3** (E2 can start right after B2; E3 after C1)
6. **F** (writing tests alongside earlier phases is welcome; F makes it systematic and adds CI)
7. **G**: whenever Judge0 is switched on

## Ready-to-use prompts

- **Phase A:** "Read CLAUDE.md and audit/IMPLEMENTATION_PLAN.md Phase A. Implement Phase A tasks 1–6 on branch `fix/phase-a`, one commit per task, using the local stack in audit/harness. Verify every acceptance criterion (re-run audit/harness/api-tests-1.mjs and -2.mjs) and report results. Do not touch other phases."
- **Phase B1:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase B1. Fix BUG-01, 02, 03, 04, 13, 14 and the backend part of BUG-18 on `fix/phase-b1`. Verify with the Redis stop/start test and the Judge0-offline submit test described in the acceptance criteria."
- **Phase B2:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase B2. Fix BUG-05, 06, 07, 08 and the frontend timeout on `fix/phase-b2`. Verify each acceptance criterion in the browser against the local stack and attach screenshots under audit/screenshots/fixes/."
- **Phase C1:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase C1. Add env validation, a central error contract, zod request validation for every endpoint in AUDIT_REPORT §4, and pino logging on `fix/phase-c1`. Re-run audit/harness/api-tests-1.mjs and show that every former 500 is now a 4xx."
- **Phase C2:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase C2. Implement headers, trust proxy, Redis-backed and split rate limits, AI cost controls, self-hosted Monaco and CSP, health endpoints and graceful shutdown on `fix/phase-c2`. List the infra steps for Judge0 TLS for the owner instead of doing them."
- **Phase D:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase D. Implement pagination, topic caching, the isSolved flag, submission list/detail split, cache headers, atomic problem numbering and lazy AuthModal on `fix/phase-d`. Report before/after payload sizes and bundle chunks."
- **Phase E1:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase E1. Make problem updates skip Judge0 for metadata-only changes, validate all reference solutions, and build a shared multi-language ProblemForm for create and update on `fix/phase-e1`."
- **Phase E2:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase E2. Fix markdown styling, auth-modal accessibility, form labels, landmarks/404, editor persistence and reset, URL-synced filters and the Home error state on `fix/phase-e2`. Verify in the browser at desktop and 390px."
- **Phase E3:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase E3. Consolidate the auth middlewares, remove duplicate auth pages and dead deps, extract judgeService and rewrite the README on `fix/phase-e3`. Ask me before deleting root node_modules/ or docs/."
- **Phase F:** "Read CLAUDE.md and IMPLEMENTATION_PLAN.md Phase F. Add backend and frontend test suites covering the listed cases, backend ESLint/Prettier, a Dockerfile and a GitHub Actions CI workflow on `fix/phase-f`. Show the CI run passing locally (act or equivalent) and the coverage summary."
- **Phase G:** "Judge0 is back on at <staging URL>. Read AUDIT_REPORT.md §7 and IMPLEMENTATION_PLAN.md Phase G. Run the full re-test checklist against a staging backend (never production data), record results in audit/JUDGE0_RETEST.md, measure submit latency, and recommend whether to implement the async queue."
