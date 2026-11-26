# Guest Mode: design (Phase 1)

Status: **approved and implemented** on branch `feat/guest-mode` (2026-11-26).

### Decisions (owner answers, 2026-11-26)
| # | Question | Decision |
|---|---|---|
| D1 | Guest session lifetime | **4 hours**, fixed (no sliding) |
| D2 | Upgrade path when a guest signs up or logs in | **Discard** guest submissions; no claim endpoint |
| D3 | AI tutor for guests | **Allowed, 5 questions per guest session** |
| D4 | Unlock Solutions after an Accepted guest submission | **No**: Solutions stay locked for guests |
| D5 | Existing demo users and submissions | **Let them expire on their own** (TTL drain, ≤24h); no early deletion |
Scope: replace the 24-hour "demo account" with a one-click **Guest Mode**.

Conventions in this doc:
- **⇄ Alternative** marks a point where a reasonable alternative exists. The recommendation comes first.
- File references are relative to the repo root.

---

## 0. Where the codebase and the spec disagree

These need your call or at least your awareness. Each is also handled in the sections below.

| # | Spec says | Codebase reality | What this design does |
|---|---|---|---|
| C1 | Remove demo "env vars" and "seed data" | There are **no** demo env vars, and **no** demo seed data. The only related bits: `backend/seed/tools/db.js` prints demo user / `demo_*` Redis key counts, and gitignored `backend/backups/*/users.json` may hold demo users. | Update `db.js`. Leave backups alone (local, gitignored). |
| C2 | Restrict guests from "leaderboard, streaks" | Neither feature exists. Guest-relevant features that do exist: profile/stats, solved badges, solved filter, Solutions tab, AI tutor, account deletion, admin. | Restriction table (section 6) covers only what exists. |
| C3 | "When a user tries to solve a problem without being authenticated" | Today an anonymous visitor can't even **view** a problem: `/problem/:problemId` is a `ProtectedRoute` and `GET /problem/:id` uses `requireUser`. | Guests can view and solve. Fully anonymous visitors still cannot (unchanged). |
| C4 | Silent on the AI tutor | The demo allowed 3 AI questions/day (Gemini costs money). | 5 questions per guest session (D3). |
| C5 | "Don't change signup/login" vs. a possible upgrade carry-over | Carrying guest work into an account requires either changing `/user/login`/`/user/register` or a separate endpoint called after them. | **Discard** (D2). Login and signup are untouched. |
| C6 | Guests can solve | The Solutions tab unlocks from `User.problemsSolved`, which guests don't have. | Locked for guests with a sign-up prompt (D4). |
| C7 | n/a | `CLAUDE.md` is out of date: it says there are no tests, CI or backend lint, but there are Vitest suites (backend: supertest + mock Judge0; frontend: Testing Library) and a GitHub Actions CI. | Phase 2 adds automated tests to those suites. `CLAUDE.md` demo lines are updated too. |

---

## 1. Current state: how the demo account works

### Flow
1. Auth modal has a third tab **Demo** → "Start Instant Demo Session".
2. `POST /user/demo` (rate limited, 5 per 15 min per IP) creates a **real `User` document**: email
   `demo_<ts>_<hex>@guest.oncode.local`, a bcrypt-hashed random password, `isDemo: true`, `expiresAt = now + 24h`.
   It returns a normal user JWT (24h, with an `isDemo` claim). The frontend stores it in `localStorage.token`.
3. From then on the demo user is a normal user: `requireUser` loads the user from MongoDB and rejects it once
   `expiresAt` has passed.
4. Quotas in Redis: 20 code executions per 24h (`demo_runs:<id>`), 3 AI questions per 24h (`demo_ai:<id>`), with
   refunds when Judge0 or Gemini fails. Both fail open when Redis is down.
5. Demo submissions go into the main `submissions` collection with `isDemo: true` and the user's `expiresAt`.
6. Expiry: TTL indexes on `users.expiresAt` and `submissions.expiresAt`, plus an hourly in-process sweep
   (`cleanupDemoWorker`) because TTL deletes bypass the Mongoose cascade hook.
7. The admin dashboard excludes `isDemo` users and submissions from its counts.

### Every file it touches

| Area | File | Demo-specific code |
|---|---|---|
| Backend route | `backend/src/routes/userAuth.js` | `POST /user/demo`, `demoLimiter` import |
| Backend controller | `backend/src/controllers/userAuthenticate.js` | `demoLogin`; `deleteProfile` demo 403 branch; `checkAuth` returns `isDemo`, `expiresAt` |
| Backend controller | `backend/src/controllers/submissionController.js` | `checkDemoExecutionLimit`, `refundDemoExecution`, quota calls in `submitCode`/`runCode`, `isDemo`/`expiresAt` on `Submission.create` |
| Backend controller | `backend/src/controllers/chatWithAI.js` | `DEMO_AI_DAILY_LIMIT`, `takeDemoAiQuota`, `refundDemoAiQuota` |
| Backend controller | `backend/src/controllers/adminController.js` | `isDemo` filters in three dashboard queries |
| Middleware | `backend/src/middlewares/authenticate.js` | selects `isDemo expiresAt`; expired-demo rejection; header comment |
| Middleware | `backend/src/middlewares/rateLimits.js` | `demoLimiter` |
| Model | `backend/src/models/user.js` | `isDemo`, `expiresAt`, TTL index |
| Model | `backend/src/models/submission.js` | `isDemo`, `expiresAt`, TTL index |
| Worker | `backend/src/utils/cleanupDemoWorker.js` | whole file |
| Boot | `backend/src/server.js` | `initDemoCleanupWorker()`; comment mentions demo quotas |
| Comment | `backend/src/utils/tokenBlocklist.js` | "24 h for demo" |
| Seed tooling | `backend/seed/tools/db.js` | prints `isDemo` users and `demo_runs:*` / `demo_ai:*` key counts |
| Frontend state | `frontend/src/features/auth/authSlice.js` | `loginDemoUser` thunk + reducers; modal mode `'demo'` |
| Frontend | `frontend/src/components/AuthModal.jsx` | Demo tab, demo panel, two "Try Demo" links, `onDemoSubmit` |
| Frontend | `frontend/src/components/GlobalNavbar.jsx` | "24h Temporary Demo Session" label |
| Frontend | `frontend/src/pages/UserProfile.jsx` | demo badge and "Temporary Guest Session" notice |
| Frontend | `frontend/src/utils/axiosClient.js` | `'/user/demo'` in `AUTH_ENDPOINTS` |
| Docs | `README.md` | "Demo mode" feature bullet; "demo quotas" in the Data and Degraded-mode lines |
| Docs | `CLAUDE.md` | overview, repo map, auth conventions (`/user/demo`, "demo 24h") |
| Docs | `audit/OWNER_TODO.md` | two checklist items about demo quotas |
| Historical | `audit/AUDIT_REPORT.md`, `FINAL_REPORT.md`, `FINDINGS.csv`, `FIX_*`, `audit/raw/*`, `audit/harness/api-tests-2.mjs`, `api-tests-3.mjs` | audit records and an old harness that calls `/user/demo` |
| Data (prod) | MongoDB `users` (`isDemo: true`), `submissions` (`isDemo: true`), two TTL indexes; Redis `demo_runs:*`, `demo_ai:*` | |
| Env vars | none | |
| Tests | none | no current test covers demo |

---

## 2. Guest identity

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Stateless guest JWT (recommended)** | `POST /user/guest` signs `{ typ: "guest", gid: <128-bit random hex> }` with `JWT_KEY`, fixed lifetime. No DB write. | No `users` pollution, no bcrypt hash per click, no cleanup worker; admin/user stats untouched; cheap to issue; same Bearer plumbing as users. | A JWT can't be revoked by itself (fixed by the existing Redis blocklist on "Exit guest mode"); the token type must be checked carefully so a guest token can never act as a user (see §8). |
| B. Guest `User` document with TTL (today's demo) | Real user row, `isGuest`, `expiresAt`. | Every existing route "just works". | That convenience is the problem: guests silently get every user capability unless each route opts out. Plus a DB write and a bcrypt hash per click (an abuse vector), junk emails, `isDemo` filters in every stats query, and the cascade-cleanup worker. |
| C. Fully client-side | No identity; run/submit open to anonymous callers. | Simplest backend. | No per-session quotas or rate keys, so Judge0 is open to anyone. History would be client-only. |

**Recommendation: A.**
- Token claims: `typ: "guest"`, `gid` (random id, never an ObjectId), standard `iat`/`exp`. No `_id`, no `email`, no `role`.
- **Session lifetime: fixed 4 hours** from creation. It doesn't slide. ⇄ Alternatives: a shorter fixed window
  such as 1–2h, a longer one such as 24h like the demo, or a sliding window (needs token re-issue). **Decided: 4 hours (D1).**
- Storage on the client: **`localStorage.guestToken`**, a separate key from the user `token`.
  - Survives refresh and browser restart (until the 4h expiry), and is shared by every tab, so a second tab is the same guest.
  - A separate key means guest and user sessions can never be confused on boot. `checkAuth` (`GET /user/check`)
    is unchanged for users.
  - ⇄ Alternative: `sessionStorage`, so the session ends when the tab closes. Rejected: each new tab would be a
    different guest (or not a guest at all), and the History tab would look empty, which is confusing.

---

## 3. Guest submission storage and expiry

| Option | Pros | Cons |
|---|---|---|
| **A. Separate MongoDB collection `guestsubmissions` with a TTL index (recommended)** | Server-side record, so History works after a refresh, in a second tab, and through the existing endpoints/UI. Each doc carries its own `expiresAt`, so the TTL index needs no worker. A **separate** collection means no `Submission` query, stat or admin count changes, and no `isDemo`-style filters to forget. Volume is bounded by quotas (below). | MongoDB's TTL monitor runs about every 60s, so expired docs linger briefly. Reads also filter `expiresAt > now`, so a lingering doc is never shown. One small write per guest submit. |
| B. Redis list per guest (`guest:subs:<gid>`, `EXPIRE` = token expiry) | Exact expiry, no Mongo writes. | Puts attacker-sized data (up to 64 KB of code per submission) in the same Redis that backs the rate limiters, which **fail open** on store errors. Filling Redis memory could switch off rate limiting. The Redis Cloud free tier is small. Redis is "degradable" in this app, so history would vanish during an outage. |
| C. Client only (memory / `sessionStorage` / `localStorage`) | Never leaves the browser; zero backend storage. | Nothing server-side to verify. Separate History code path in the UI. Per-tab with `sessionStorage`. |

**Recommendation: A.** It meets requirement 5 through "expire quickly": guest submissions live only as long as the
guest session (≤ 4h), and are never mixed with real submissions.

`GuestSubmission` model (`backend/src/models/guestSubmission.js`):
- `guestId` (String, required), `problemId` (ObjectId → Problem), `code`, `language` (`cpp`|`java`), `status`,
  `runtime`, `memory`, `errorMessage`, `testCasesPassed`, `testCasesTotal`, `expiresAt` (Date, required), timestamps.
- **Not stored:** `failedTestCase`, `errorDetail` (admin-only diagnostics; not needed for throwaway sessions).
- Indexes: `{ expiresAt: 1 }` with `expireAfterSeconds: 0`; `{ guestId: 1, problemId: 1, createdAt: -1 }`.
- `expiresAt` = the guest token's `exp`, so the data and the session end together.
- Unlike the user flow there's no `Pending` row: the record is written once, after the verdict. A Judge0 failure writes nothing.

**Run** (visible sample test) stores nothing, same as today.

---

## 4. Backend changes

### Config
- `backend/src/config/guest.js`: constants in one place, namely session hours, per-session execution and AI quotas, and limiter sizes.
- `backend/src/config/env.js`: add optional **`GUEST_MODE_ENABLED`** (default `true`). It is a kill switch: when `false`, `POST /user/guest` answers 503 "Guest mode is currently unavailable" and existing guest tokens are rejected.
  ⇄ Alternative: no env var, only code constants. A kill switch is cheap insurance given Judge0 cost.

### Middleware (`backend/src/middlewares/authenticate.js`)
How `req.user` behaves for guests: **`req.user` is never set for a guest.** A guest gets `req.guest = { id, expiresAt }` instead.
- Why: every existing controller treats `req.user._id` as a real user id (`User.findByIdAndUpdate`, `Submission.create`,
  `User.exists`). A guest disguised as `req.user` risks guest data landing in user collections. A separate
  `req.guest` forces each guest-enabled controller to branch on purpose.
- ⇄ Alternative: a unified `req.actor = { kind: "user"|"guest", ... }`. Cleaner in theory, but it touches every controller.

Changes:
- `resolveUser`: if the verified payload has `typ === "guest"`, throw **403 `GUEST_NOT_ALLOWED`** ("Sign up or log in
  to use this feature."). It is a 403 and not a 401, so the frontend doesn't throw away a valid guest session.
- New **`requireUserOrGuest`**: a user token behaves exactly like `requireUser`. A guest token is verified, checked
  against the blocklist and against `GUEST_MODE_ENABLED`, then sets `req.guest`. No DB read.
- `optionalUser`: a guest token sets `req.user = null` and `req.guest`, explicitly rather than through a thrown error.
- `requireAdmin`: unchanged (a guest gets 403 through `resolveUser`).

### Endpoints

| Endpoint | Today | After |
|---|---|---|
| `POST /user/demo` | creates a demo user | **removed** (404) |
| `POST /user/guest` | n/a | **new.** Rate limited per IP. 201 `{ guest: { expiresAt }, token, message }`. No DB write. |
| `POST /user/logout` | `requireUser` | `requireUserOrGuest`, so "Exit guest mode" also blocklists the guest token. No change for users. |
| `POST /user/login`, `/register`, `GET /user/check`, `/user/profile`, `DELETE /user/profile`, `/user/admin/register` | | **unchanged.** Guests get 403 `GUEST_NOT_ALLOWED` on the user-only ones. |
| `GET /problem/` | `optionalUser` | unchanged; guests see no solved badges, and the solved filter is hidden for them |
| `GET /problem/:id` | `requireUser` | `requireUserOrGuest` (no controller change) |
| `GET /problem/solved` | `requireUser` | unchanged (403 for guests) |
| `GET /problem/:id/solution` | `requireUser` | `requireUserOrGuest`; guest → 403 `isLocked` with a sign-up message, always (D4) |
| `GET /problem/submissions/:id` | `requireUser` | `requireUserOrGuest`; guest branch lists `GuestSubmission` by `guestId` + `problemId` + `expiresAt > now`, same response shape |
| `POST /submission/run/:id` | `requireUser` | `requireUserOrGuest` + guest quota/limiters; no storage |
| `POST /submission/submit/:id` | `requireUser` | `requireUserOrGuest` + guest quota/limiters; guest branch writes `GuestSubmission`, **never** touches `problemsSolved` or `submissions` |
| `GET /submission/:id` | `requireUser` | `requireUserOrGuest`; guest branch: `GuestSubmission.findOne({ _id, guestId })`, 404 otherwise |
| `POST /chatAI/doubt` | `requireUser` | `requireUserOrGuest` + 5 questions per guest session (D3) |
| Admin routes | `requireAdmin` | unchanged |

⇄ Alternative: a separate `/guest/*` route namespace with its own controllers. That gives stronger isolation, but it
duplicates run/submit logic and the workspace would need a second set of URLs. Recommended: the same routes, with
an explicit `if (req.guest)` branch in the four controllers that need one.

### Models
- **New:** `GuestSubmission` (above).
- **`User`:** remove `isDemo`, `expiresAt` and the TTL index declaration.
- **`Submission`:** remove `isDemo`, `expiresAt` and the TTL index declaration.
- The existing TTL indexes stay **in the database** until the drain is done (see §10). Mongoose does not drop indexes on its own.

---

## 5. Frontend changes

### State (`frontend/src/features/auth/authSlice.js`)
- Add `isGuest: boolean` and `guest: { expiresAt } | null`. `isAuthenticated` keeps meaning "**real user**", so
  every existing check (`user`, `isAuthenticated`, `role`) keeps working without a guest slipping through.
- New thunks: `startGuestSession` (`POST /user/guest`, stores `guestToken`) and `endGuestSession` (best-effort
  `POST /user/logout`, then removes `guestToken`).
- Boot: if `token` exists, run `checkAuth` (unchanged). Otherwise, if `guestToken` exists, decode its `exp` locally
  (UX only, since the server still verifies). If it's still valid, restore guest state with no network call. If it has expired, remove it.
- When login or register succeeds, `guestToken` is removed and the guest state is cleared. That is a clean-up step
  after success; the login and register requests and responses are unchanged.
- Modal modes: `'login' | 'signup' | 'guest-expired'`. `'demo'` goes away.
- Remove `loginDemoUser`.

### HTTP client (`frontend/src/utils/axiosClient.js`)
- The request interceptor sends `token` if present, otherwise `guestToken`.
- `AUTH_ENDPOINTS`: replace `/user/demo` with `/user/guest`.
- 401 while in guest mode: clear guest state and open the modal in `guest-expired` mode ("Your guest session
  ended. Start a new one, or sign up to save your work.").
- 403 with `GUEST_NOT_ALLOWED`: open the modal in `signup` mode.
- A `storage` event listener: when `token` or `guestToken` changes in another tab, re-sync auth state. Otherwise
  tab A could keep showing "guest" while sending tab B's new user token.

### Auth modal (`frontend/src/components/AuthModal.jsx`): the three options
- Keep the **Sign Up / Log In** tab switcher. Their forms stay exactly as they are.
- Below either form: an "or" divider and a full-width **Continue as Guest** button with a one-line caption,
  "No account needed. Your progress won't be saved." **One click** starts the session, closes the modal and
  navigates to `redirectPath` (the problem they clicked).
- ⇄ Alternative: a third "Guest" tab with a confirm button. Two clicks, and more friction than the goal allows.

### Guest notice (requirement 6, at selection time)
- When the session starts, show a prominent notice right away (`role="status"`, it stays until dismissed and isn't timed):
  **"You're in guest mode. Your progress won't be saved. Sign up or log in to save your progress."**
  with **Sign up**, **Log in** and **Got it** buttons.
- New component `frontend/src/components/GuestNotice.jsx`, rendered once at app level and driven by a flag set by `startGuestSession`.

### Persistent reminder (requirement 6) and easy upgrade (requirement 7)
- **`GlobalNavbar`** (rendered on Home, Workspace and Profile): while `isGuest`, show a subtle **"Guest · progress
  not saved"** badge (with time remaining in a tooltip) plus **Sign up** and **Log in** buttons and a small
  menu holding **Exit guest mode**. It takes no extra vertical space, which matters in the full-height workspace.
- ⇄ Alternative: a full-width strip under the navbar. It's more visible, but it costs about 32px in the workspace layout.

### Route guards (`frontend/src/App.jsx`)
- `/problem/:problemId`: new `SolveRoute` allows `isAuthenticated || isGuest`; anyone else goes to the modal as today.
- `/profile`: users only. A guest is redirected to `/` and the modal opens in `signup` mode.
- `/admin/*`: unchanged (a guest is not authenticated, so they are redirected).
- `Home.handleProblemClick`: a guest navigates straight in; an anonymous visitor gets the modal as today.

### Workspace
- **Submissions tab** for guests: header "This guest session only. Cleared when the session ends."
- **Solution tab** for guests: locked panel, "Sign up and solve this problem to unlock the official solution." (D4)
- **Accepted** result for a guest: an extra line, "Accepted! Sign up to save this to your profile."
- **AI tutor**: 5 questions per guest session (D3). When its quota is used up, show "Create a free account to keep asking."
- Editor drafts (`localStorage oncode:code:<problem>:<lang>`) are not user-scoped today, so they survive the guest
  session and are still there after sign-up on the same browser. This is kept on purpose: it's local
  convenience, not saved progress. ⇄ Alternative: clear drafts when guest mode ends.

### Cleanup
- `UserProfile.jsx` and `GlobalNavbar.jsx`: remove `isDemo` UI.

---

## 6. Feature restrictions for guests

| Feature | Guest | What they see instead |
|---|---|---|
| Problem list, search, filters | Yes | No "solved" badges; the Solved/Unsolved filter is hidden |
| Problem statement, editor, drafts | Yes | |
| Run (sample test) | Yes, counts toward quota | 429 message with a sign-up CTA when the quota runs out |
| Submit (hidden tests) | Yes, counts toward quota | Accepted shows the "sign up to save" line |
| Submissions history | Current session only | Session-only header |
| Official solutions | No (D4) | Locked panel with sign-up CTA |
| AI tutor | 5 questions per session (D3) | Quota message with CTA |
| Profile / stats / solved list | No | `/profile` redirects to sign-up |
| Delete account | n/a | |
| Admin | No | Redirect |
| Leaderboard, streaks | Don't exist (C2) | |

---

## 7. Abuse and Judge0 load

Layers, from cheapest to strictest (all Redis-backed via the existing `limiter()` factory):

| Control | Key | Proposed limit | On Redis outage |
|---|---|---|---|
| Guest session creation | IP | 10 per hour | fail **closed** (503) |
| Per-guest execution quota (run + submit) | `gid` | 30 per session | fail **closed** |
| Existing `submitLimiter` (users and guests) | IP | 50 per 15 min (unchanged) | fail open (unchanged) |
| Global guest execution budget | constant key | 300 per 15 min across all guests | fail **closed** |
| Per-guest AI quota | `gid` | 5 per session (D3) | fail **closed** |
| Existing AI per-IP limiter | IP | 20 per 10 min (unchanged) | fail open (unchanged) |

- **Why fail closed for guests:** the app normally fails open on Redis outages so real users aren't locked out. For
  anonymous one-click guests, the quota *is* the abuse control, so during an outage guest execution answers 503
  "Guest mode is temporarily unavailable. Log in or sign up to continue." Users are unaffected.
  ⇄ Alternative: keep fail-open everywhere, consistent with the rest of the app, but anyone could hammer Judge0 during an outage.
- **Why a global budget:** per-IP limits don't stop many IPs. A global guest cap protects Judge0 (and your EC2 bill)
  from distributed abuse, and users never share that budget.
- Quota refunds when Judge0 fails reuse today's demo refund pattern (BUG-14).
- Size limits are unchanged: 100 KB JSON body, 64,000-character code cap (413), base64 + truncation of outputs.
- Every number lives in `config/guest.js`, and `GUEST_MODE_ENABLED=false` turns guest mode off instantly.

---

## 8. Security: keeping guests out of user data

- **Type confusion:** a guest token has no `_id`, and `resolveUser` explicitly rejects `typ: "guest"`. A token
  that carries both `typ: "guest"` and an `_id` is treated as a guest, never as a user (covered by a test). The
  `gid` is random hex, not an ObjectId, so even a bug that let it reach `User.findById` would match nothing.
- **Ownership:** `guestId` comes only from the verified token, never from params or the body. Every guest query is
  filtered by `guestId`, and user submissions are in another collection, so a guest can't reach them even with an id.
- **No leakage changes:** the guest submit response uses the same `toPublicSubmission` whitelist (no hidden tests,
  stderr or driver code). `failedTestCase` and `errorDetail` aren't even stored for guests.
- **Revocation:** "Exit guest mode" blocklists the token in Redis like logout. With a 4h expiry, the exposure
  window is small even without it.
- **Stats isolation:** guest work never touches `users`, `submissions` or `problemsSolved`, so the user profile,
  admin dashboard and acceptance rates can't be inflated by guests.
- Same signing key (`JWT_KEY`). ⇄ Alternative: a separate `GUEST_JWT_KEY`. That adds a secret to manage, and with the `typ` check it adds little.

---

## 9. Upgrade path (a guest signs up or logs in mid-session)

**Recommendation: discard.** When signup or login succeeds, the guest token is dropped, guest history disappears
from the UI, and its `GuestSubmission` docs expire through TTL within the session window. Editor drafts stay
(local, see §5).
- It matches the promise made to the guest ("Your progress won't be saved").
- Login and signup need no change (spec rule).
- No claim/merge logic means no new attack surface. Without it, a stolen guest token can't be used to put
  "Accepted" results into someone else's account.

⇄ **Alternative: carry over.** After login/signup, the frontend calls a new `POST /user/guest/claim` with the guest
token. It copies the session's `GuestSubmission`s into `submissions` and adds Accepted problems to `problemsSolved`,
then blocklists the guest token. Login and signup stay untouched. It's a better conversion hook ("keep your 3 solved
problems"), but it contradicts the guest notice wording and needs its own tests. **Not chosen (D2).**

---

## 10. Migration and cleanup of demo code and data

**Code:** remove everything in the §1 table except the historical `audit/` records, which are left as-is because
they're dated audit evidence. `audit/harness/api-tests-2.mjs` and `api-tests-3.mjs` will hit a 404 on
`/user/demo`. They are a frozen harness, so they get a one-line note rather than a rewrite.

**Data. No destructive step runs without your explicit go-ahead.**
1. **Drain (automatic, no action):** the TTL indexes on `users.expiresAt` and `submissions.expiresAt` live in MongoDB,
   not in the Mongoose schema, so they keep deleting demo users and demo submissions until 24h after the last demo
   session. Redis `demo_runs:*` and `demo_ai:*` keys expire within 24h on their own.
   - Caveat: once the `isDemo` check is removed, a demo token that's still valid works as a normal user, with no
     quota, until it expires (at most 24h). The TTL deletes the user at the same moment. Accepted (D5).
2. **Optional script** `backend/scripts/drop-demo-artifacts.js`, written in the style of `mark-stale-pending.js`:
   it reads only `MONGO_URI`, defaults to a dry run, and `--apply` performs the changes. Meant to run **after** the
   drain (D5): it reports remaining `isDemo` docs and refuses to change anything while any are left; otherwise it
   drops the two `expiresAt_1` TTL indexes and `$unset`s `isDemo`/`expiresAt`. It never deletes users or submissions. **I will write it but not run it.** Running it against production is your call.
3. Admin dashboard `isDemo` filters are removed in the same change. During the ≤24h drain, the dashboard may count a
   few leftover demo users and submissions.

**Docs and env:** update the README (feature bullet, Data and Degraded-mode lines, new Guest mode section),
`backend/.env.example` (add `GUEST_MODE_ENABLED`), `CLAUDE.md` (demo references, plus the outdated
tests/CI line), and the two demo items in `audit/OWNER_TODO.md`. There are no demo env vars to remove.

---

## 11. Edge cases

| Case | Behaviour |
|---|---|
| Page refresh | `guestToken` in `localStorage` restores guest state on boot with no network call; history reloads from the server. |
| Second tab | Shares `localStorage`, so it's the same guest and the same history. A `storage` listener keeps auth state in sync if one tab logs in or exits. |
| Guest session expires mid-edit | Code is safe in drafts. Next Run/Submit → 401 → `guest-expired` modal: **Start new guest session** (one click, keeps the code), Sign up, Log in. Old history is gone. |
| Guest logs in on the same browser | `guestToken` removed, guest UI gone, user session as normal; guest history is discarded (D2). |
| Logged-in user | "Continue as Guest" is never shown. |
| Guest opens `/profile` or `/admin` | Redirect; `/profile` opens sign-up. |
| Guest hits a user-only API directly | 403 `GUEST_NOT_ALLOWED`; the guest session survives. |
| Guest quota exhausted | 429 with a sign-up CTA; Run/Submit stay visible. |
| Redis down | Users unaffected (fail open as today). Guest creation/execution 503 with a log in / sign up CTA (fail closed). |
| Judge0 down | Same 503 as users; quota refunded; no `GuestSubmission` written. |
| `GUEST_MODE_ENABLED=false` | `POST /user/guest` 503; existing guest tokens 401, so the frontend shows "guest mode unavailable". |
| Clock skew on client-side `exp` decode | Only affects the badge countdown and boot restore; the server stays authoritative. |
| Problem deleted while a guest has submissions | `GuestSubmission` docs expire via TTL; the list joins nothing, so no crash. |

---

## 12. Test plan

### Backend (Vitest + supertest, existing harness in `backend/tests/`, mock Judge0)
New `backend/tests/guest.test.js`:
- `POST /user/guest` → 201, token decodes to `typ: guest`, no `User` created; limiter returns 429 after the cap.
- `POST /user/demo` → 404.
- Guest token on `GET /user/check`, `/user/profile`, `DELETE /user/profile`, `/problem/solved`, `/admin/*`,
  `/user/admin/register` → 403 `GUEST_NOT_ALLOWED` (not 401).
- Type confusion: a token with `typ: guest` **and** a real user's `_id` gets no user access.
- Guest can `GET /problem/:id`, run, submit (mock Judge0). Submit creates exactly one `GuestSubmission` with
  `expiresAt` = token `exp`; `submissions` count and `problemsSolved` unchanged.
- Isolation: guest A can't list or read guest B's submission (404); a guest can't read a user's submission by id;
  a user can't read a guest submission.
- Quota: 31st execution → 429; a Judge0 failure refunds the quota and writes nothing.
- Global guest budget → 429. Redis down → guest 503, user run still works.
- Expired / wrong-key / blocklisted guest token → 401. `GUEST_MODE_ENABLED=false` → 503 / 401.
- `guestsubmissions` has the TTL index (`expireAfterSeconds: 0` on `expiresAt`).
- Admin dashboard and user stats are unchanged by guest activity.
- Existing `auth.test.js` / `authz.test.js` / `submission.test.js` stay green **unmodified**, as regression proof that signup and login didn't change.

### Frontend (Vitest + Testing Library, `frontend/src/__tests__/`)
- `authSlice`: `startGuestSession` sets `isGuest`; login/register fulfilled clears guest; boot restores an
  unexpired `guestToken` and drops an expired one.
- `AuthModal`: Sign up, Log in, and Continue as Guest are all present; the guest caption text is there; clicking it dispatches and navigates.
- `GuestNotice` shows the exact required message with Sign up / Log in actions.
- `GlobalNavbar` shows the guest badge and Sign up / Log in while `isGuest`.
- Routes: guest reaches `/problem/:id`, is redirected from `/profile`.
- Interceptor: guest 401 → guest cleared and `guest-expired` modal; 403 `GUEST_NOT_ALLOWED` → signup modal.
- Grep check in CI review: no `isDemo`, `loginDemoUser`, `/user/demo` left in `src/`.

### Manual checklist (local, disposable Docker Mongo/Redis; local Judge0 in WSL or the mock)
1. Anonymous → click problem → modal shows three options → Continue as Guest → lands on problem, notice visible.
2. Run and Submit work; history shows only this session; refresh keeps it; second tab shows the same.
3. Navbar badge visible everywhere; Sign up from the badge → account created → guest UI gone, history gone, draft kept.
4. Exit guest mode → back to anonymous.
5. Shorten the session in config → wait → Run → `guest-expired` modal → new guest session keeps code.
6. Exhaust quota → 429 message with CTA.
7. Stop Redis → guest blocked with CTA, user still works.
8. Login/signup flows behave exactly as before.

---

## 13. Phase 2 step plan (each a small, reviewable commit on a new `feat/guest-mode` branch)

1. Backend: guest config, guest token, `requireUserOrGuest`, `POST /user/guest`, `GUEST_NOT_ALLOWED` + tests.
2. Backend: `GuestSubmission` model; guest branches in run/submit/list/detail; quotas and limiters + tests.
3. Backend: solution lock, AI tutor (5 per session) + tests.
4. Frontend: auth slice, axios client, boot restore, cross-tab sync + tests.
5. Frontend: AuthModal guest option, GuestNotice, navbar reminder, route guards + tests.
6. Frontend: workspace guest touches (history header, solution lock, Accepted CTA).
7. Remove demo: backend, then frontend.
8. Docs and env example; optional drain script (written, **not run**).

No new dependencies are expected. `jsonwebtoken`, `express-rate-limit`/`rate-limit-redis`, Mongoose and zod already cover everything.
