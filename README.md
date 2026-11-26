# Oncode – Online Coding Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Now-blue?style=for-the-badge)](https://oncode-self.vercel.app/)

A LeetCode-style platform: browse problems, solve them in C++ or Java in a browser editor, run the sample test,
submit against hidden tests on a self-hosted Judge0, and get hints from an AI tutor.

## Screenshots

<img width="1916" height="937" alt="Problem list" src="https://github.com/user-attachments/assets/e4dde490-aa3c-4f3b-84b4-35c9702ea1f0" />
<img width="1912" height="938" alt="Problem workspace" src="https://github.com/user-attachments/assets/a5f16218-8147-4350-a68d-ee3a9d8b81ab" />

---

## Features

### For users
- **Problem list:** search, filters (difficulty, topic, solved/unsolved) and pages, all kept in the URL so links
  and reloads keep the view. Solved problems are ticked.
- **Workspace:** Monaco editor (bundled, no CDN) offering only the languages a problem supports (C++ and/or Java).
  Each language keeps its own code, drafts survive reloads (stored in the browser per account, so another
  account or a guest on the same browser never sees them), and there's a "Reset to starter code" button.
- **Run** checks the visible sample test. **Submit** grades every hidden test case; hidden inputs and expected
  outputs are never shown. Compile errors show the compiler output; runtime errors show a short message.
- **History:** paginated past submissions per problem; a submission's code loads when you expand it.
- **Solutions** unlock after you solve a problem.
- **AI tutor** (Gemini): asks about your current code with the problem loaded server-side. It gives hints, not
  full solutions. Rate-limited per user and per network.
- **Profile:** solved counts by difficulty, submission totals and acceptance rate (graded submissions only);
  account deletion.
- **Guest mode:** "Continue as Guest" in the sign-in dialog starts solving in one click, with no account. See
  [Guest mode](#guest-mode) below.

### Guest mode
A guest session is a signed 4-hour token with a random id. No user document is created and nothing is saved to a
profile. The UI says so when the session starts ("You're in guest mode. Your progress won't be saved...") and
keeps a **Guest** badge with **Sign up** / **Log in** in the navbar.

| | Guest |
|---|---|
| Problem list, statements, editor, drafts | yes |
| Run + Submit | yes, 30 per session (plus a global guest budget and the usual per-IP limit) |
| Submission history | this session only, kept in `guestsubmissions` and deleted by a TTL index when the session ends |
| AI tutor | 5 questions per session |
| Official solutions, profile, stats, solved badges, admin | no |

- Guest submissions never touch `submissions`, solved lists, profile stats or the admin dashboard.
- Signing up or logging in ends guest mode, and that session's submissions are **discarded** (its code drafts
  move to the account).
- Guest limits fail **closed**: if Redis is down, guest mode pauses (503) while signed-in users keep working.
- `GUEST_MODE_ENABLED=false` switches guest mode off (new sessions get 503, existing guest tokens stop working).
- Settings live in `backend/src/config/guest.js`; design notes in [`docs/GUEST_MODE_DESIGN.md`](docs/GUEST_MODE_DESIGN.md).

### For admins (`/admin`)
- Dashboard: problems by difficulty, users by role, submissions and acceptance rate.
- **Create and edit problems** with one shared form: optional slug, statement (Markdown), topics, constraints, examples, the visible
  sample test, hidden test cases, and per language a starter snippet, driver code (with `{{USER_CODE}}`) and a
  reference solution. Every reference solution is run on Judge0 before saving; metadata-only edits (title,
  statement, topics...) save without Judge0.
- Delete problems (cascades to submissions and solved lists).
- Register users or admins.

There is no admin "all submissions" view.

---

## Tech stack
- **Frontend:** React 19, Vite 8, React Router 7, Redux Toolkit, Tailwind 4 + DaisyUI 5 + typography, Monaco,
  react-markdown, react-hook-form + zod, axios. Deployed on Vercel (`frontend/vercel.json`: SPA rewrite + CSP and
  security headers).
- **Backend:** Node ≥ 20, Express 5, Mongoose 9, node-redis 5, zod (env + request validation), pino logging,
  helmet, express-rate-limit with a Redis store, JWT (Bearer) + bcrypt, @google/genai.
- **Data:** MongoDB (replica set: problem deletion uses a transaction), Redis (token blocklist, rate limits,
  guest quotas, topic cache).
- **Code execution:** Judge0 CE 1.13.1 (self-hosted on AWS EC2), see [Judge0](#judge0).

---

## Getting started

```bash
git clone https://github.com/rwtchandrpal/oncode.git
cd oncode
(cd backend && npm install)
(cd frontend && npm install)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Environment variables
The backend validates these at boot (`backend/src/config/env.js`) and exits listing any missing or invalid
**names**. Full template: [`backend/.env.example`](backend/.env.example).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MONGO_URI` | yes | – | MongoDB connection string (replica set) |
| `JWT_KEY` | yes | – | JWT signing secret (64 random hex chars) |
| `REDIS_HOST` | yes | – | Redis host |
| `REDIS_PORT` | no | `6379` | Redis port |
| `REDIS_PASS` | no | – | Redis password |
| `JUDGE0_BASE_URL` | yes | – | Judge0 base URL (`https://` recommended) |
| `JUDGE0_AUTH_TOKEN` | no | – | Judge0 `X-Auth-Token` |
| `JUDGE0_TIMEOUT_MS` | no | `5000` | Timeout per Judge0 HTTP request |
| `JUDGE0_DEADLINE_MS` | no | `30000` | Overall budget for one run/submit/validation |
| `GEMINI_API_KEY` | yes | – | Google Gemini API key for the AI tutor |
| `CLIENT_URL` | no | `http://localhost:5173` | The one origin allowed by CORS |
| `PORT` | no | `3000` | HTTP port |
| `TRUST_PROXY_HOPS` | no | `0` | Reverse proxies in front of the API (Express `trust proxy`); must match the host |
| `LOG_LEVEL` | no | `info` | pino level |
| `GUEST_MODE_ENABLED` | no | `true` | Kill switch for guest mode (`false` turns it off) |
| `NODE_ENV` | no | `development` | `development` / `production` / `test` |

Frontend: `VITE_API_URL` (public, bundled into the client), default `http://localhost:3000`.

> Never point a local `.env` at the production MongoDB Atlas cluster or Redis Cloud. Use separate dev
> credentials or the local Docker stack below.

### Local development stack (Docker)
```bash
docker run -d --name oncode-dev-mongo -p 127.0.0.1:27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec oncode-dev-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
docker run -d --name oncode-dev-redis -p 127.0.0.1:6379:6379 redis:7-alpine
```
Then set `MONGO_URI=mongodb://127.0.0.1:27017/oncode_dev?replicaSet=rs0&directConnection=true`, `REDIS_HOST=127.0.0.1`,
`REDIS_PORT=6379` and an empty `REDIS_PASS`. Without a reachable Judge0, Run/Submit/problem create answer 503.
`audit/harness/` has a seeded variant with test accounts, sample problems and a **mock Judge0**
(`node audit/harness/mock-judge0.mjs`, then `JUDGE0_BASE_URL=http://127.0.0.1:2358`).

### Run
```bash
cd backend && npm run dev      # API on :3000 (nodemon)
cd frontend && npm run dev     # SPA on :5173
```
Frontend checks: `npm run lint`, `npm run build`, `npm run preview` (serves the build with the same CSP as Vercel).

### Creating the first admin
There is no sign-up path to admin (registration always creates `role: "user"`, and `POST /user/admin/register`
needs an admin). Register normally in the app, then promote that account once in MongoDB:
```bash
mongosh "<MONGO_URI>" --eval 'db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })'
```
The role is re-read from the database on every request, so the next request is already an admin one (no new
login needed). Further admins can be created from `/admin/users`. The last admin cannot delete their own
account (409).

### Judge0
Run and Submit, and admin problem create/edit (which runs every reference solution), need a Judge0 CE
instance. The platform uses language **54** (C++, GCC 9.2.0, compiled with `-Wall -Werror=return-type`) and **62**
(Java, OpenJDK 13.0.1), batch submissions with base64, and Judge0's default limits (5 s CPU per test).
- Install Judge0 CE **1.13.1** with its docker-compose release on a Linux host with **cgroup v1** (for example
  Ubuntu 22.04 booted with `systemd.unified_cgroup_hierarchy=0`); it does not run on cgroup v2 as released.
- In `judge0.conf` set `AUTHN_HEADER=X-Auth-Token` and a long random `AUTHN_TOKEN`; put the same value in
  `JUDGE0_AUTH_TOKEN`. Open port 2358 only to the backend (security group / private network), or put TLS in front.
- Capacity: a 10-test submission is 10 Judge0 jobs. If concurrent submissions start failing with 503 ("Code
  execution is temporarily unavailable"), the batch did not finish within `JUDGE0_DEADLINE_MS` (default 30 s):
  add workers (`COUNT` in `judge0.conf`) or CPU, or raise the deadline.
- Check it from the app with `GET /submission/health` as an admin.

### Seeding problems
The problem set is the **Blind 75**, kept as data in [`backend/seed/`](backend/seed/): one verified JSON file per
problem (`problems/<slug>.json`), with C++ and Java starter code, driver code, reference solutions and up to 10
tests whose expected outputs come from running the reference solutions on Judge0. `FORMAT.md` describes the format,
`DECISIONS.md` the choices behind it, `FINAL_REPORT.md` the verification results.

Run these from `backend/`, with `MONGO_URI` in `backend/.env` pointing at the target database:
```bash
node seed/seed.js --dry-run                                   # offline: checks every file, touches no database
node seed/seed.js --dry-run --connect --creator <admin email> # reads the database, reports insert/update
node seed/seed.js --creator <admin email> --yes               # upserts all 75 problems by slug
```
`seed.js` refuses any file that changed since it was verified, validates every document against the Problem model,
and needs an existing admin user (the problems' creator). It is safe to run again: problems are matched by `slug`.

To replace an existing problem set: `node seed/tools/db.js backup` (exports every collection to
`backend/backups/<timestamp>/`, git-ignored), then `node seed/tools/db.js clear --confirmed` (deletes problems,
submissions and the problem-number counter, empties every user's solved list, drops stale problem indexes and the
cached topic list), seed, and check with `node seed/tools/db.js check`.

To change or add a seed problem: edit `seed/spec/<slug>.js`, `seed/tools/gen/<slug>.js` and
`seed/reference/<slug>/`, then `node seed/tools/build.js <slug>` and `node seed/tools/verify.js <slug>` (both need
a Judge0). New problems can also be added in the admin form, which takes the same fields, including an optional
`slug`; test cases may be up to 200 KB each.

### Tests and CI
```bash
cd backend && npm test            # vitest + supertest against MongoDB/Redis (see below), mock Judge0
cd backend && npm run test:coverage
cd frontend && npm test           # vitest + Testing Library (jsdom)
```
Backend tests need a MongoDB replica set and a Redis, by default the `audit/harness` Docker containers
(`127.0.0.1:27018` and `:6380`). Point them elsewhere with `TEST_MONGO_URI`, `TEST_REDIS_HOST/PORT/PASS`; the database
name must contain "test" and the tests wipe it. Judge0 is always an in-process mock.
`.github/workflows/ci.yml` runs, for each app: `npm ci`, lint, tests, `npm audit --omit=dev --audit-level=high`, and the
frontend build / backend Docker image build.

---

## Operations
- **Health:** `GET /healthz` (process up), `GET /api/health` (process up, plus `uptime` and `timestamp`; the SPA
  pings it to show its "server waking up" banner during free-tier cold starts) and `GET /readyz` (MongoDB + Redis ping; 503 when not ready). The Judge0
  diagnostic `GET /submission/health` is admin-only.
- **Degraded mode:** the API starts and keeps serving if Redis is down (logout revocation and rate limits fail
  open with warnings; guest mode pauses with a 503 because its quotas fail closed); it exits if MongoDB is
  unreachable at boot. SIGTERM/SIGINT shut down cleanly.
- **Errors** are always `{ "error": { "code", "message" } }`; internal details are only logged.
- **Deploy:** frontend on Vercel (`frontend/`, output `dist`). The backend runs on any Node 20+ host. Set the
  variables above in the host's secret store and `TRUST_PROXY_HOPS` to its proxy count. A `backend/Dockerfile`
  is provided. Judge0 should be reached over TLS or a private network.
- **One-off cleanup:** `backend/scripts/mark-stale-pending.js` turns old `Pending` submissions (from Judge0 outages
  before the fix) into `System Error`. Dry run by default, `--apply` to write.
- **After removing demo accounts:** old demo users and submissions delete themselves through their TTL indexes
  within 24 hours of the last demo session. After that, `backend/scripts/drop-demo-artifacts.js` drops the
  leftover `expiresAt`/`isDemo` indexes and fields. It refuses to change anything while demo documents remain,
  never deletes users or submissions, and is a dry run unless you pass `--apply`.

---

## What I learned
- Secure authentication using JWT and token revocation with Redis
- Integrating AI assistance (Gemini API) as a programming tutor
- REST API design, validation and a consistent error contract
- Integrating and managing a remote Judge0 execution engine
- Protecting endpoints with rate limiting
- State management in React with Redux Toolkit
