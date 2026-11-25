# Owner TODO: steps only you can do

Everything here needs your accounts, infrastructure or production data, so none of it was attempted. The code side
of each item is already on `fix/all-phases`. Do them roughly in this order.

---

## 1. Review and merge `fix/all-phases`
The branch is local only (never pushed).

```powershell
cd D:\projects\oncode
git log --oneline main..fix/all-phases
git diff --stat main...fix/all-phases
```
1. Read `audit/FINAL_REPORT.md` and `audit/FIX_LOG.md` (per-phase changes, deviations, evidence).
2. Run the checks yourself (local Docker stack from `audit/harness/README.md` must be running for backend tests):
   ```powershell
   cd D:\projects\oncode\backend; npm ci; npm run lint; npm test
   ```
   ```powershell
   cd D:\projects\oncode\frontend; npm ci; npm run lint; npm test; npm run build
   ```
3. Push and open a PR so GitHub Actions (`.github/workflows/ci.yml`) runs. It has only been run locally so far:
   ```powershell
   git push -u origin fix/all-phases
   ```
   ```powershell
   gh pr create --base main --head fix/all-phases --title "Audit fixes: phases A-F" --body-file audit/FINAL_REPORT.md
   ```
4. Merge only when CI is green. Deploy the backend **before** the frontend (the frontend now expects the new error
   shape, paginated lists, `GET /submission/:id`, `GET /problem/:id/admin` and the AI `problemId` field).
5. Note: one commit on `main` (`5d849c0 chore: snapshot before fix work`) was made locally before branching; it
   only adds `CLAUDE.md` and `audit/`. Push `main` too or let the PR carry it.

## 2. Production environment variables (backend host)
Set in the host's secret store (not in a file on the server). Full list: `backend/.env.example`; the server refuses to
start and prints the **names** of anything missing.
- **New and required in practice:** `CLIENT_URL` (the Vercel origin), `GEMINI_API_KEY` (now validated at boot).
- **New, optional:** `JUDGE0_DEADLINE_MS` (default 30000), `TRUST_PROXY_HOPS` (see 3), `LOG_LEVEL`, `NODE_ENV=production`.
- **Changed default:** `JUDGE0_TIMEOUT_MS` is now 5000 if unset (was 10000).
- **Remove `USER_ID`** from `backend/.env` and the host. No code reads it; I could not edit `.env` (reading it is blocked for me).

## 3. Set `TRUST_PROXY_HOPS` on the backend host (SEC-09)
Default is `0` (trust no proxy: `req.ip` is the socket address). Behind a proxy, every user would then share the
proxy's IP for rate limiting.
1. Find how many reverse proxies sit between the internet and Node (e.g. Render/Railway/Heroku/Fly: usually **1**;
   Cloudflare in front of that: **2**).
2. Set `TRUST_PROXY_HOPS=<n>` and redeploy.
3. Verify: temporarily log `req.ip` (or watch the pino request logs). It must show the **client** IP, and sending
   `X-Forwarded-For: 1.2.3.4` yourself must **not** change it. A too-high value lets clients spoof IPs and dodge rate limits.

## 4. Judge0 over TLS and rotate `JUDGE0_AUTH_TOKEN` (SEC-04)
Today the API talks to Judge0 over plain HTTP, sending the token and all user code. Do one of:
- **Option A, TLS in front of Judge0 on EC2 (recommended):**
  1. Point a DNS name at the instance (e.g. `judge0.yourdomain.com`; an Elastic IP is already attached).
  2. Install Caddy on the instance and use this `/etc/caddy/Caddyfile`:
     ```
     judge0.yourdomain.com {
         reverse_proxy 127.0.0.1:2358
     }
     ```
     `sudo systemctl reload caddy` (Caddy obtains the certificate automatically).
  3. Security group: allow 443 (and 80 for the ACME challenge) and **remove** public access to 2358.
- **Option B, private network:** restrict the security group's 2358 rule to the backend's egress IP (or VPC
  peering), keeping HTTP but off the internet.

Then:
1. Generate a new token: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Set it as `AUTHN_TOKEN` in Judge0's `judge0.conf`, then restart Judge0 (`docker compose up -d`).
3. Set `JUDGE0_AUTH_TOKEN=<new>` and `JUDGE0_BASE_URL=https://judge0.yourdomain.com` on the backend host. The env
   schema accepts `http(s)` only.
4. Check as an admin: `GET /submission/health` → `{"isOnline":true,...}`.

## 5. Separate development credentials (SEC-14)
Your local `backend/.env` points at the hosted Atlas cluster and Redis Cloud (likely production).
1. Atlas: create a separate **dev** project/cluster (or at least a separate database user restricted to an
   `oncode_dev` database). Redis Cloud: create a separate free dev database.
2. Put only dev values in your local `backend/.env`, or use the local Docker stack from the README.
3. Keep production values only in the backend host's secret store.
4. Optional: rotate the production Atlas/Redis passwords once the local file no longer has them.

## 6. Google Cloud spend cap for Gemini (SEC-06)
The code now limits AI use (10/10 min per user, 20/10 min per IP, demo 3/day) and loads the problem server-side, but
a hard budget is still needed.
1. Google Cloud console → **Billing → Budgets & alerts → Create budget** for the project that owns `GEMINI_API_KEY`
   (e.g. $5/month, alerts at 50/90/100 %).
2. **APIs & Services → Generative Language API → Quotas**: lower the requests-per-day / per-minute quota to what you
   can afford. That is the actual hard stop; budgets only alert.
3. Restrict the API key to the Generative Language API (**Credentials → key → API restrictions**).

## 7. Clean old `Pending` submissions in production (BUG-01)
Records left by past Judge0 outages still show as "Pending" in users' history (stats already ignore them).
Run from your machine with the production URI in the environment of that one command only:
```powershell
cd D:\projects\oncode\backend
$env:MONGO_URI = '<production mongodb+srv URI>'; node scripts/mark-stale-pending.js; Remove-Item Env:MONGO_URI
```
Check the printed host and count (dry run), then apply:
```powershell
$env:MONGO_URI = '<production mongodb+srv URI>'; node scripts/mark-stale-pending.js --apply; Remove-Item Env:MONGO_URI
```
Option: `--older-than-minutes=60` to leave anything recent alone.

## 8. Vercel checks after deploy (SEC-12, SEC-07)
1. `curl -I https://oncode-self.vercel.app/` should show `Content-Security-Policy`, `X-Frame-Options: DENY`,
   `X-Content-Type-Options`, `Referrer-Policy`.
2. Open a problem with DevTools → Network: no request to `cdn.jsdelivr.net`; the editor works; Console shows no CSP
   violations.
3. Tighten CSP `connect-src` in `frontend/vercel.json` from `'self' https:` to `'self' https://<your-backend-host>`
   (the backend host is not in the repo, so the code uses `https:`).

## 9. Phase G: re-test with Judge0 switched on
Do this against a **staging** backend (the local Docker stack plus the real Judge0 over TLS), never production data.
Record results in `audit/JUDGE0_RETEST.md`. Everything below was verified only with a mock Judge0.
- [ ] Run returns Accepted / Wrong Answer for the visible test; `actualOutput` and `expectedOutput` render correctly.
- [ ] Submit: Accepted adds to `problemsSolved` (only once on repeat solves) and unlocks the Solution tab.
- [ ] Status mapping for compile error (6), TLE (5), each runtime error (7–12), Internal Error (13); UI colours and messages.
- [ ] C++ `-Wall -Werror=return-type` behaves as intended (now also applied to reference-solution validation); Java
      class naming with the driver (`Main` vs `Solution`) compiles.
- [ ] Wrong-answer response exposes no hidden input/expected output; a program that prints stdin to stderr and exits
      non-zero does not reveal the hidden input (SEC-03).
- [ ] Partial pass counts (`testCasesPassed`) are correct when failing on test k > 1.
- [ ] Latency: p50/p95 of Submit with 2, 10 and 50 hidden tests; frontend 60 s timeout message (BUG-18). Judge0's
      default `MAX_SUBMISSION_BATCH_SIZE` is 20, so check problems with more hidden tests.
- [ ] Judge0 reachable but slow / `In Queue` past `JUDGE0_DEADLINE_MS`: clear 503, record marked `System Error`, no Pending (BUG-01).
- [ ] Admin create: every language's reference solution validated; failures name the language (BUG-10).
- [ ] Admin update: metadata-only edit skips Judge0; a test-case edit re-validates (BUG-09).
- [ ] Demo quota: 20 *successful* runs then 429; failed infrastructure calls refunded (BUG-14).
- [ ] TLS to Judge0 and the rotated `JUDGE0_AUTH_TOKEN` work end to end (SEC-04).
- [ ] Rate limits behind the real proxy apply per client, not globally (SEC-09, `TRUST_PROXY_HOPS`).
- [ ] Decide PERF-04 (queue + callback vs synchronous polling) from the latency table; write a short decision record.

## 10. Optional follow-ups
- Run `npm run format` once in each app and enable `npm run format:check` in CI (Prettier is configured, not enforced).
- Refresh `CLAUDE.md` §3 and §7: they still describe the pre-fix code.
