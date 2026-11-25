# Final report: audit fixes on `fix/all-phases`

Date: 2026-11-25 · Repository: `D:\projects\oncode` · Base: `main` (`5d849c0`, the pre-work snapshot) · Not pushed.
Detailed per-phase notes, deviations and evidence: `audit/FIX_LOG.md`. Owner steps: `audit/OWNER_TODO.md`.

## 1. Phase status

| Phase | Scope | Status | Notes |
|---|---|---|---|
| A | SEC-01, 02, 03, 05, 08, 10, 14 | **Done** | sanitizeFilter needed `mongoose.trusted()` on code-written operators (the plan assumed none) |
| B1 | BUG-01, 02, 03, 04, 13, 14, 18 (backend) | **Done** | boot policy "start anyway"; blocklist fails open |
| B2 | BUG-05, 06, 07, 08, 18 (frontend) | **Done** | account deletion uses a hard redirect (soft navigate reopened the modal) |
| C1 | BUG-11, 12, 17, CQ-02, 04, 06, SEC-11 | **Done** | 200 KB password now hits the 100 KB body cap (413); 73 B–90 KB → 400 |
| C2 | SEC-04 (infra), 06, 07, 09, 12, OPS-01, 02 | **Done** (SEC-04 → owner) | CSP worked first time; SIGTERM verified in a Linux container |
| D | PERF-01, 02, 03, 05, SEC-13, BUG-16 | **Done** | also fixed a C2 regression (every page preloaded Monaco) |
| E1 | BUG-09, BUG-10 | **Done** | snippet without reference solution still allowed (existing data) |
| E2 | UX-01..07, BUG-15 | **Done** | interrupted once by a usage limit and resumed; KaTeX (optional) not added |
| E3 | SEC-15, CQ-03, 05, 07 (partial), OPS-03 | **Done** | root `node_modules/` and `docs/` deleted; `USER_ID` in `.env` left for the owner |
| F | CQ-01, OPS-04 | **Done** (GitHub CI run deferred: no push) | real Mongo/Redis instead of in-memory fakes; SEC-01 revert check done |
| G | Judge0 re-test | **Skipped** (Judge0 is off) | checklist in `OWNER_TODO.md` §9 |

## 2. Findings: resolved vs open (56 total)

**Resolved in code (50):** SEC-01, SEC-02, SEC-03*, SEC-05, SEC-06, SEC-08, SEC-09*, SEC-10, SEC-11, SEC-12, SEC-13, SEC-15,
BUG-01*, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07, BUG-08, BUG-09*, BUG-10*, BUG-11, BUG-12, BUG-13, BUG-14*, BUG-15,
BUG-16, BUG-17, PERF-01, PERF-02, PERF-03, PERF-05, CQ-01, CQ-02, CQ-03, CQ-04, CQ-05, CQ-06, UX-01, UX-02, UX-03, UX-04,
UX-05, UX-06, UX-07, OPS-01, OPS-02, OPS-03, OPS-04.

\* verified with a mock Judge0 only; real-Judge0 confirmation is part of Phase G. SEC-09 also needs `TRUST_PROXY_HOPS` set on the host.

**Partially resolved / open (6)**, plus one owner residual of CQ-05:
| ID | State | What remains |
|---|---|---|
| SEC-04 | Open (infra) | Judge0 TLS or private network + token rotation (`OWNER_TODO` §4). Code accepts `https://` |
| SEC-07 | Partial | Monaco self-hosted + CSP done; the JWT still lives in `localStorage` (design decision: httpOnly refresh cookie not in plan) |
| SEC-14 | Partial | `.env.example` files + local stack done; separate dev credentials are an owner step (§5) |
| BUG-18 | Partial | backend deadline, 60 s client timeout, max-runtime reporting done; latency measurement needs Judge0 (G) |
| PERF-04 | Open | async queue decision depends on Phase G latency numbers |
| CQ-07 | Partial | `services/judgeService.js` extracted; splitting the workspace into hooks was not done |
| CQ-05 residual | Owner | remove the unused `USER_ID` from `backend/.env` (I could not edit `.env`) |

## 3. Acceptance criteria

Every criterion in `IMPLEMENTATION_PLAN.md` A–F, with evidence, is in `FIX_LOG.md`. Totals: **all PASS except:**
| Criterion | Result | Why |
|---|---|---|
| C2: Vercel preview responses include the CSP header | DEFERRED | tested with `vite preview` serving the same `vercel.json` headers; Vercel itself not touched (`OWNER_TODO` §8) |
| F: CI green on the PR | DEFERRED | no push/PR by instruction; every CI step run locally and passing |
| C1: 200 KB password at register → 400 | PASS with note | 413 from the Phase A 100 KB body cap; 73 B–90 KB passwords → 400 |
| C2: `kill -TERM` clean shutdown | PASS (Linux container) | Windows cannot deliver SIGTERM to a Node handler |
| All Judge0-dependent behaviour | PASS (mock) / DEFERRED (real) | Phase G |

No criterion ended as FAIL. The only unresolved items are the owner/infra steps listed above.

## 4. Before / after metrics

| Metric | Before (baseline, `main`) | After (`fix/all-phases`) |
|---|---|---|
| `npm audit --omit=dev` backend | 13 (2 critical, 6 high, 5 moderate) | **0** |
| `npm audit --omit=dev` frontend | 11 (9 high, 2 moderate) | **0** |
| `npm audit` (incl. dev) backend / frontend | 13 / 16 | 2 moderate / 2 moderate (dev tooling only) |
| Initial JS on first load | 427.5 kB (139.0 kB gz) incl. `schemas` + `index.esm`; Monaco then fetched from jsDelivr | 348.4 kB (116.8 kB gz); Monaco bundled in the lazy workspace chunk (2.98 MB / 771 kB gz) |
| Home API calls per filter change (signed in) | 2 | 1 |
| `GET /problem/` without params | up to 1000 rows | 20 rows + pagination |
| Submission history payload (25 rows) | 6.5 kB with seed code, ~43 kB with 1.5 kB solutions, unpaginated | 3.6 kB for 20 rows; code fetched per row |
| Login timing gap, known vs unknown email | 4 ms vs 64 ms | 58.7 vs 67.7 ms (diff 9.0 ms) |
| Pending records per failed Submit (Judge0 down) | 1 | 0 |
| Automated tests | 0 | backend 34, frontend 9 |
| Line coverage (backend) | – | controllers 61.1 %, middlewares 93.6 %, all `src` 68.0 % |
| Lint | frontend only, 0 problems | frontend 0, backend 0 (new ESLint config) |
| CI | none | `.github/workflows/ci.yml` (lint, test, audit, build, docker) |

## 5. Commits on `fix/all-phases` (67 before this report, oldest first)

- `d92aad9` docs(audit): add fix log and progress tracker with baseline
- `93c1e7f` fix(deps): bump vulnerable dependencies within semver ranges (SEC-02)
- `53300df` fix(auth): reject non-string login fields and enable sanitizeFilter (SEC-01, SEC-10)
- `4bc2dcd` fix(api): stop leaking internal error details; Judge0 failures return 503 (SEC-05)
- `775462b` fix(submission): never return hidden test data or stderr in submit responses (SEC-03)
- `768d001` fix(api): cap request bodies at 100 KB and code at 64,000 chars (SEC-08)
- `02e5115` docs: add .env.example files and a local Docker dev stack (SEC-14)
- `b2f6713` docs(audit): Phase A verification results
- `1da2503` fix(redis): add error listener and reconnect backoff so outages no longer crash the API (BUG-02)
- `1105ca2` fix(server): exit on MongoDB failure, start listening and connect Redis in the background (BUG-03)
- `5e65722` fix(auth): fail open on Redis blocklist errors; 401 only for JWT errors, 503 otherwise (BUG-04)
- `1b5b687` fix(submission): no Pending orphans on Judge0 failure; charge demo quota only for valid runs (BUG-01, BUG-14)
- `4a11b8e` fix(stats): count only graded submissions; add Pending cleanup script (BUG-13)
- `6dce081` fix(judge0): 30 s overall deadline across create and poll; 5 s per request (BUG-18)
- `e358ede` docs(audit): Phase B1 verification results; tolerate empty submissions in api-tests-2
- `788b1a8` fix(auth): add sessionCleared and clear the session when logout fails (BUG-08)
- `fb41a00` fix(client): clear the Redux session and reopen sign-in on 401; 60 s run/submit timeout (BUG-07, BUG-18)
- `16fedeb` fix(profile): sign out locally after account deletion instead of calling logout (BUG-08)
- `3dd983a` fix(workspace): keep one Monaco model per language so switching never overwrites code (BUG-05)
- `fec7fbb` fix(workspace): show "Problem not found" or a retry instead of an endless spinner (BUG-06)
- `c47af32` fix(profile): hard-redirect after account deletion so the sign-in modal does not reopen (BUG-08)
- `9921dc9` docs(audit): Phase B2 verification results
- `2268d43` feat(config): validate environment at boot with zod; exit listing missing names (CQ-02)
- `528c832` feat(logging): pino + pino-http with Authorization/password/token redaction (CQ-06)
- `1b03327` feat(api): single error contract { error: { code, message } } with central handler (BUG-11, CQ-04)
- `5484103` feat(api): zod request validation on every endpoint (BUG-12, SEC-11)
- `f3eb6df` fix(client): align signup/admin schemas with the backend: lastName optional, firstName min 1, password <= 72 bytes (BUG-17)
- `99d17c4` fix(validation): say "is required" for missing auth fields
- `45a3a8d` docs(audit): Phase C1 verification results
- `30e79e1` feat(security): helmet headers, drop X-Powered-By, trust proxy from TRUST_PROXY_HOPS (SEC-12, SEC-09)
- `d1c38c4` feat(security): Redis-backed rate limits; separate register/login; per-email login and per-IP AI limits (SEC-09, SEC-06)
- `0d5c318` feat(ai): load problem context server-side from problemId; demo AI quota 3/day (SEC-06)
- `cea9721` feat(client): self-host Monaco and add CSP/security headers on Vercel (SEC-07, SEC-12)
- `77824cb` feat(ops): GET /healthz (liveness) and GET /readyz (Mongo + Redis ping) (OPS-01)
- `93d1ed9` feat(ops): graceful shutdown on SIGTERM/SIGINT and unhandledRejection logging (OPS-02)
- `f812b95` docs(audit): Phase C2 verification results; start OWNER_TODO
- `bd5c7f8` perf(problems): always paginate the list (20 default, 100 max), cache topics, isSolved per row (PERF-01, PERF-05)
- `b6c15b1` perf(submissions): paginate history without code; fetch code via owner-scoped GET /submission/:id (PERF-02)
- `fb7a761` fix(problems): GET /problem/:id uses Cache-Control private, max-age=60 (SEC-13)
- `fb983a3` fix(problems): atomic problem numbering via a counters collection (BUG-16)
- `f82b22f` perf(client): lazy-load AuthModal; keep Monaco out of the initial bundle (PERF-03)
- `3e9cdbc` docs(audit): Phase D verification results and metrics
- `e86122e` fix(admin): skip Judge0 for metadata-only edits; validate every reference solution; admin GET /problem/:id/admin (BUG-09, BUG-10)
- `4c005a9` feat(admin): shared ProblemForm with per-language snippet, driver and solution; full edit form (BUG-09, BUG-10)
- `98643a3` fix(workspace): offer only the languages the problem has driver code for (BUG-10)
- `a449521` docs(audit): Phase E1 verification results
- `b814f04` fix(ui): style problem statements with @tailwindcss/typography; bordered tables (UX-01)
- `dce9a64` fix(a11y): auth modal moves focus in, traps Tab, restores focus on close; sr-only labels (UX-02)
- `c37d854` docs(audit): record progress and remaining work at E2
- `c51ecf5` fix(a11y): associate admin user-form labels with their inputs; labelled role radiogroup (UX-03)
- `ab4145e` fix(a11y): nav and main landmarks, visually hidden Problems heading, 404 links home (UX-04)
- `0808e96` feat(workspace): keep editor drafts per problem and language across reloads; Reset to starter code (UX-05)
- `3bdce90` feat(home): page and filters in the URL, topic badges link to the filtered list, error state with Retry (UX-06, UX-07, BUG-15)
- `17a1041` docs(audit): Phase E2 verification results
- `3b815db` docs(audit): fix progress status line
- `1bebc6b` refactor(auth): one authenticate module with requireUser, requireAdmin, optionalUser (CQ-03)
- `81d7642` refactor(client): drop duplicate Login/Signup pages; /login and /signup open the auth modal (CQ-03)
- `10872ad` refactor: share base64 helpers (backend) and difficulty colours (frontend) (CQ-03)
- `0205be8` chore(backend): remove cookie-parser, validator and CORS credentials; nodemon to devDependencies (SEC-15, CQ-05)
- `05c674d` refactor(judge): extract services/judgeService.js shared by submit, run and problem validation (CQ-07)
- `007039f` docs: rewrite README around actual features, env (matches config/env.js), local stack and operations (OPS-03)
- `0145719` docs(audit): Phase E3 verification results
- `7b7c543` test(backend): vitest + supertest infrastructure; export the Express app from src/app.js (CQ-01)
- `592eff5` test(backend): auth, SEC-01 regression, authorization matrix, data exposure, submit with mocked Judge0, stats
- `7c2726e` test(frontend): vitest + Testing Library for authSlice, the 401 interceptor and workspace language buffers
- `629fbba` chore(lint): backend ESLint (flat config, eslint-plugin-n) and Prettier config for both apps (CQ-01)
- `28c93f6` ci: GitHub Actions for lint, tests, npm audit and builds; backend Dockerfile (OPS-04, CQ-01)
- (this report and the final progress update)

Also on `main` before branching: `5d849c0 chore: snapshot before fix work` (adds `CLAUDE.md` and `audit/`).

## 6. Unresolved and worth knowing

- **Owner steps** (`OWNER_TODO.md`): Judge0 TLS + token rotation, separate dev credentials, Gemini spend cap,
  `TRUST_PROXY_HOPS`, production Pending cleanup, `USER_ID` removal, Vercel CSP check / `connect-src` tightening,
  Phase G, review and merge.
- **Deploy order:** backend before frontend; response shapes changed together (error contract, pagination,
  `/submission/:id`, AI `problemId`).
- **Behaviour changes to be aware of:** register rejects unknown keys (e.g. `role`) with 400; `?limit=all` is gone
  (400); reference solutions now compile with `-Wall -Werror=return-type`; `/login` and `/signup` open the modal on `/`;
  during a Redis outage a logged-out token stays valid until it expires (≤ 1 h, demo ≤ 24 h) and rate limits fail open.
- **Noticed but not fixed** (full list in `FIX_LOG.md`): compile output on hidden tests can quote driver lines;
  a backend outage signs users out (`checkAuth` drops the token on network errors); the workspace chunk triggers
  Vite's size warning; Prettier configured but not applied; `CLAUDE.md` §3/§7 are out of date.
- **Session note:** the session started in `D:\projects\mentora` (a different project, untouched); all work is in
  `D:\projects\oncode`.
