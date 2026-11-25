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
  Each language keeps its own code, drafts survive reloads, and there's a "Reset to starter code" button.
- **Run** checks the visible sample test. **Submit** grades every hidden test case; hidden inputs and expected
  outputs are never shown. Compile errors show the compiler output; runtime errors show a short message.
- **History:** paginated past submissions per problem; a submission's code loads when you expand it.
- **Solutions** unlock after you solve a problem.
- **AI tutor** (Gemini): asks about your current code with the problem loaded server-side. It gives hints, not
  full solutions. Rate-limited per user and per network.
- **Profile:** solved counts by difficulty, submission totals and acceptance rate (graded submissions only);
  account deletion.
- **Demo mode:** one click creates an isolated 24-hour guest account (20 code runs, 3 AI questions), deleted
  automatically when it expires.

### For admins (`/admin`)
- Dashboard: problems by difficulty, users by role, submissions and acceptance rate.
- **Create and edit problems** with one shared form: statement (Markdown), topics, constraints, examples, the visible
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
  demo quotas, topic cache).
- **Code execution:** Judge0 CE (self-hosted on AWS EC2).

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

---

## Operations
- **Health:** `GET /healthz` (process up) and `GET /readyz` (MongoDB + Redis ping; 503 when not ready). The Judge0
  diagnostic `GET /submission/health` is admin-only.
- **Degraded mode:** the API starts and keeps serving if Redis is down (logout revocation, rate limits and demo
  quotas fail open with warnings); it exits if MongoDB is unreachable at boot. SIGTERM/SIGINT shut down cleanly.
- **Errors** are always `{ "error": { "code", "message" } }`; internal details are only logged.
- **Deploy:** frontend on Vercel (`frontend/`, output `dist`). The backend runs on any Node 20+ host. Set the
  variables above in the host's secret store and `TRUST_PROXY_HOPS` to its proxy count. A `backend/Dockerfile`
  is provided. Judge0 should be reached over TLS or a private network.
- **One-off cleanup:** `backend/scripts/mark-stale-pending.js` turns old `Pending` submissions (from Judge0 outages
  before the fix) into `System Error`. Dry run by default, `--apply` to write.

---

## What I learned
- Secure authentication using JWT and token revocation with Redis
- Integrating AI assistance (Gemini API) as a programming tutor
- REST API design, validation and a consistent error contract
- Integrating and managing a remote Judge0 execution engine
- Protecting endpoints with rate limiting
- State management in React with Redux Toolkit
