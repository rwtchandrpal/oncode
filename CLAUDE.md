# CLAUDE.md — Oncode

## 1. Project overview
Oncode is a LeetCode-style online coding platform (MERN). Users browse a problem list
(search / difficulty / topic / solved filters), solve problems in a Monaco editor in **C++ or Java**,
and Run (visible sample test) or Submit (all hidden tests) through a self-hosted **Judge0** on AWS EC2.
It also has profiles and stats, 24-hour isolated **demo sessions**, a Gemini-backed **AI tutor**, and an
admin area (dashboard metrics, create/edit/delete problems, register users or admins).

## 2. Tech stack (from package.json)
| Layer | Packages |
|---|---|
| Frontend | React 19.2, Vite 8 (rolldown), react-router 7.14, Redux Toolkit 2.11 + react-redux 9.2, Tailwind 4.2 + DaisyUI 5.5, axios 1.15, @monaco-editor/react 4.7, react-markdown 10 + remark-gfm 4, react-hook-form 7 + zod 4, lucide-react |
| Backend | Node >= 20 (dev machine: Node 24.11), Express 5.2, Mongoose 9.3, redis (node-redis) 5.11, jsonwebtoken 9, bcrypt 6, express-rate-limit 8.6, validator 13, compression, cors, cookie-parser (unused since the move to Bearer tokens), @google/genai 2.4, axios, dotenv 17, nodemon (listed as a prod dependency) |
| Infra | MongoDB Atlas, Redis Cloud, Judge0 CE on EC2 (HTTP, `X-Auth-Token`), Vercel for the frontend (`frontend/vercel.json`) |

## 3. Repo map
```
/                    README.md, .gitignore, stray root node_modules/ (compression only, no root package.json)
docs/                empty
backend/
  src/server.js      Express app: CORS, compression, JSON 5mb, routers, global error handler, DB + Redis boot
  src/config/        db.js (mongoose.connect), redis.js (node-redis client)
  src/routes/        userAuth.js (/user), problemRoutes.js (/problem), submitRoute.js (/submission),
                     adminRoutes.js (/admin), chatAIRoute.js (/chatAI); rate limiters live here
  src/middlewares/   userMiddleware (JWT + Redis blocklist + DB user), adminMiddleware (+ role check),
                     optionalUserMiddleware (guest-friendly)
  src/controllers/   userAuthenticate.js (register/login/demo/logout/profile/stats), problemController.js
                     (problem CRUD, list, solution, per-problem submissions), submissionController.js (run/submit),
                     adminController.js (dashboard), chatWithAI.js (Gemini)
  src/models/        user.js, problem.js (codeSnippets with driverCode, hiddenTestCases, referenceSolutions), submission.js
  src/utils/         judge0Utility.js (batch submit + poll), validate.js (register whitelist), cleanupDemoWorker.js
frontend/
  src/main.jsx, App.jsx   router + route guards (ProtectedRoute, AdminRoute, PublicOnlyRoute), lazy routes
  src/store/, features/auth/authSlice.js   single Redux slice: auth + auth-modal state
  src/utils/axiosClient.js                 axios instance, Bearer token from localStorage, 401 interceptor
  src/pages/               Home (problem list), UserProfile, authentication/{Login,Signup},
                           problemWorkspace/problemWorkspace.jsx, admin/{AdminLayout,AdminDashboard,ManageProblems,
                           CreateProblem,UpdateProblem,UserManagement}
  src/components/          AuthModal, GlobalNavbar, Problem{Description,Solution,Submissions,ChatAI,CodeEditor,
                           Testcase,Result}, ResultDisplay
  src/validations/         zod schemas (auth, problem)
  vercel.json              SPA rewrite of everything to /index.html
audit/                     audit deliverables (report, findings CSV, plan, progress, screenshots, local test harness)
```

## 4. How to run
- Install: `npm install` in `backend/` and in `frontend/`.
- Backend env var **names** (`backend/.env`, gitignored): `PORT`, `MONGO_URI`, `JWT_KEY`, `REDIS_HOST`,
  `REDIS_PORT`, `REDIS_PASS`, `JUDGE0_BASE_URL`, `JUDGE0_AUTH_TOKEN`, `JUDGE0_TIMEOUT_MS` (optional),
  `GEMINI_API_KEY`, `CLIENT_URL`, `USER_ID` (present in .env, unused by code).
- Frontend env var: `VITE_API_URL` (defaults to `http://localhost:3000`).
- Dev: backend `npm run dev` (nodemon, port `PORT` || 3000); frontend `npm run dev` (Vite, 5173).
  Frontend calls the backend directly at `VITE_API_URL`; CORS allows `CLIENT_URL` only.
- Build: `cd frontend && npm run build`. Lint: `cd frontend && npm run lint`. Backend has no tests or lint.
- **Local / audit runs must not use the Atlas and Redis Cloud values in `backend/.env`.** Override them on the
  command line with disposable Docker containers (see `audit/harness/README.md`).

## 5. Conventions observed
- CommonJS backend; ESM + JSX frontend. Controllers are plain `async (req, res)` with their own try/catch;
  no `next(err)` usage, no service layer.
- Response shape is inconsistent: usually `{ message, ...data }`; errors are `{ message }` but the AI route returns
  `{ error }`. Many 500s concatenate `err.message` into the message.
- Auth: `POST /user/login|register|demo` returns `{ user, token }`; the frontend stores the token in
  `localStorage.token` and sends `Authorization: Bearer`. JWT lifetime is 1h (demo 24h), with no refresh token.
  Logout puts the token on a Redis blocklist (`token:<jwt>`). Middleware re-reads the user (and role) from Mongo on every request.
- Frontend pages fetch with `axiosClient` inside `useEffect` with an `isMounted` guard. Only auth lives in Redux.
- Styling uses DaisyUI semantic classes (`bg-base-200`, `text-base-content/60`); dark theme only.

## 6. Rules for this audit and future work
- Never print, log, commit or copy secrets from `.env` files. Refer to env vars by **name only** (`JWT_KEY=****`).
- Judge0 is intentionally **disabled** to save cost. Do not make real code-execution calls, and do not treat the
  outage itself as a bug. Locally, point `JUDGE0_BASE_URL` at an unreachable local port.
- No destructive commands (dropping DBs, `rm -rf`, force pushes). Never run anything against the production
  Atlas DB or Redis Cloud; use disposable local containers.
- Work in phases; after each phase update `audit/PROGRESS.md`.
- Prefer minimal, reviewable changes, one concern per change, when fixing starts (see `audit/IMPLEMENTATION_PLAN.md`).

## 7. Known limitations
- Judge0 is offline, so Run, Submit, **problem create and problem update** (both call Judge0 to validate the
  reference solution) all fail.
- Each problem stores one driver snippet and one reference solution (the create form edits index 0 only), but the
  workspace always offers both C++ and Java.
- The update form only edits title, difficulty, topics, description and constraints. Test cases, driver code and
  solutions cannot be edited from the UI.
- No admin "view all submissions" feature exists, despite the README.
- No automated tests, no CI, no backend lint.
- See `audit/AUDIT_REPORT.md` for the full findings list.
