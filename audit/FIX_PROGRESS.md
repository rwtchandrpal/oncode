# Fix progress (`fix/all-phases`)

Legend: [x] done · [~] done with caveat (see FIX_LOG) · [ ] pending · [-] skipped

## Step 0
- [x] Snapshot commit on main, branch `fix/all-phases`
- [x] Local stack (Docker Mongo rs0 + Redis, seed, backend :3100)
- [x] Baseline recorded in FIX_LOG.md

## Phase A: critical security
- [x] A1 Dependency bumps (SEC-02)
- [x] A2 Login hardening + sanitizeFilter (SEC-01, SEC-10)
- [x] A3 Error leakage, Judge0 503, health admin-only (SEC-05)
- [x] A4 Hidden tests not in submit response (SEC-03)
- [x] A5 Payload caps (SEC-08)
- [x] A6 .env.example files + README dev stack (SEC-14)
- [x] A acceptance criteria verified

## Phase B1: backend stability
- [ ] B1.1 Redis error listener + reconnect (BUG-02)
- [ ] B1.2 Boot policy: start anyway (BUG-03)
- [ ] B1.3 Middlewares fail open on Redis (BUG-04)
- [ ] B1.4 Submit: no Pending orphans, 503 (BUG-01)
- [ ] B1.5 Stats exclude Pending/System Error + migration script (BUG-13)
- [ ] B1.6 Demo quota after validation, DECR on failure (BUG-14)
- [ ] B1.7 Judge0 overall deadline (BUG-18 backend)
- [ ] B1 acceptance criteria verified

## Phase B2: frontend session/workspace
- [ ] B2.1 sessionCleared + logout rejected clears (BUG-08)
- [ ] B2.2 axios 401 interceptor + submission timeout (BUG-07, BUG-18)
- [ ] B2.3 Account delete clears session (BUG-08)
- [ ] B2.4 Per-language editor buffers (BUG-05)
- [ ] B2.5 Problem not found state (BUG-06)
- [ ] B2 acceptance criteria verified

## Phase C1: validation + error contract
- [ ] C1.1 config/env.js (CQ-02)
- [ ] C1.2 AppError + central error handler (BUG-11, CQ-04)
- [ ] C1.3 zod validate middleware on every endpoint (BUG-12, SEC-11)
- [ ] C1.4 Frontend auth schemas aligned (BUG-17)
- [ ] C1.5 pino logging (CQ-06)
- [ ] C1 acceptance criteria verified

## Phase C2: platform hardening
- [ ] C2.1 helmet, x-powered-by, trust proxy (SEC-12, SEC-09)
- [ ] C2.2 Split + Redis-backed rate limits, AI limits (SEC-09, SEC-06)
- [ ] C2.3 AI uses problemId server-side (SEC-06)
- [ ] C2.4 Self-hosted Monaco + CSP headers (SEC-07, SEC-12)
- [ ] C2.5 /healthz, /readyz (OPS-01)
- [ ] C2.6 Graceful shutdown (OPS-02)
- [ ] C2.7 Judge0 TLS → OWNER_TODO (SEC-04)
- [ ] C2 acceptance criteria verified

## Phase D: performance/data
- [ ] D1 getAllProblems pagination, topics cache, isSolved (PERF-01, PERF-05)
- [ ] D2 Home/ManageProblems use new shape
- [ ] D3 Submission list without code + GET /submission/:id (PERF-02)
- [ ] D4 getProblem cache header (SEC-13)
- [ ] D5 Atomic problem numbering (BUG-16)
- [ ] D6 Lazy AuthModal (PERF-03)
- [ ] D acceptance criteria verified

## Phase E1: admin authoring
- [ ] E1.1 Update skips Judge0 for metadata (BUG-09)
- [ ] E1.2 Validate every reference solution (BUG-10)
- [ ] E1.3 Shared ProblemForm + GET /problem/:id/admin
- [ ] E1.4 Workspace languages from snippets (BUG-10)
- [ ] E1 acceptance criteria verified

## Phase E2: UX/a11y
- [ ] E2.1 Typography plugin (UX-01)
- [ ] E2.2 Accessible AuthModal (UX-02)
- [ ] E2.3 Admin form labels (UX-03)
- [ ] E2.4 Landmarks + 404 link (UX-04)
- [ ] E2.5 Editor persistence + reset (UX-05)
- [ ] E2.6 URL-synced filters, topic badges, Home error state (UX-06, UX-07, BUG-15)
- [ ] E2 acceptance criteria verified

## Phase E3: cleanup/docs
- [ ] E3.1 Single authenticate middleware (CQ-03)
- [ ] E3.2 Remove Login/Signup pages (CQ-03)
- [ ] E3.3 Shared base64/difficulty utils (CQ-03)
- [ ] E3.4 Dead deps, root node_modules, docs/ (SEC-15, CQ-05)
- [ ] E3.5 judgeService (CQ-07)
- [ ] E3.6 README (OPS-03)
- [ ] E3 acceptance criteria verified

## Phase F: tests + CI
- [ ] F1 Backend test infra (vitest, supertest, mongodb-memory-server)
- [ ] F2 Backend tests (auth, authz matrix, exposure, submit mocked, stats)
- [ ] F3 Frontend tests
- [ ] F4 Backend ESLint + Prettier
- [ ] F5 CI workflow + Dockerfile
- [ ] F SEC-01 revert check, CI steps run locally

## Phase G
- [-] Skipped: Judge0 is off (checklist listed in OWNER_TODO.md / FINAL_REPORT.md)

## Final
- [ ] FINAL_REPORT.md
- [ ] OWNER_TODO.md
