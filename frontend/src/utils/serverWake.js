// "Server waking up" state. The backend runs on a free host that sleeps when idle, so the first
// request after a quiet spell can take 30-60+ s. This module is a tiny external store (read through
// ServerStatusProvider / useServerStatus) fed from two places:
//   1. a boot-time ping of GET /api/health (startBootCheck), and
//   2. axiosClient's interceptors (trackRequestStart / trackRequestEnd), for any request pending > 3 s.
// It lives outside React because the interceptors do.
import { API_BASE_URL } from './apiBase';

export const QUIET_MS = 2500;            // health answers faster than this: no banner at all
export const SLOW_REQUEST_MS = 3000;     // an API request pending longer than this shows the banner
export const WAKE_TIMEOUT_MS = 90000;    // give up and show "Try again" after this long
export const RETRY_DELAY_MS = 3000;      // between pings after a network error or 502/503/504
export const ATTEMPT_TIMEOUT_MS = 25000; // one ping; the host may hold the first request while booting
export const CELEBRATE_MS = 1500;        // "You're all set" before the banner goes away

// The host answers these while the app is still booting; anything else means our server answered.
const RETRY_STATUSES = new Set([502, 503, 504]);

// ---- health ping ----------------------------------------------------------------------------

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });

// One ping. Resolves to the HTTP status, or null on a network error / timeout / abort. A plain
// fetch with no custom headers, so the browser sends no CORS preflight to a sleeping server.
const pingHealth = async (signal, timeoutMs) => {
  const attempt = new AbortController();
  const onAbort = () => attempt.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => attempt.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store', signal: attempt.signal });
    return res.status;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
};

// Pings until the server answers (true) or the deadline passes / the signal aborts (false).
export const waitForServer = async (signal, deadline) => {
  while (!signal.aborted) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return false;
    const status = await pingHealth(signal, Math.min(ATTEMPT_TIMEOUT_MS, remaining));
    if (signal.aborted) return false;
    if (status !== null && !RETRY_STATUSES.has(status)) return true;
    await sleep(Math.min(RETRY_DELAY_MS, Math.max(0, deadline - Date.now())), signal);
  }
  return false;
};

// ---- store ----------------------------------------------------------------------------------

let checkPhase = 'idle';   // 'idle' | 'running' | 'failed'
let checkVisible = false;  // a running check shows the banner (after QUIET_MS at boot, at once otherwise)
let checkStartedAt = null;
let activeCheck = null;    // AbortController of the running check
let quietTimer = null;
let reloadWhenReady = false; // set by retry(): pages already showed errors, so reload once we're up

let pending = 0;           // tracked axios requests in flight
let slowSince = null;      // start time of the request that went slow; cleared when pending hits 0

let celebrating = false;    // "You're all set" after a visible wait
let reloading = false;      // ...followed by a page reload (after retry())
let celebrateTimer = null;
let tickTimer = null;

const READY = Object.freeze({ status: 'ready', elapsedSeconds: 0, celebrating: false, reloading: false });
let snapshot = READY;
let waitStartedAt = null;
const listeners = new Set();

const deriveStatus = () => {
  if (checkPhase === 'failed') return 'failed';
  if ((checkPhase === 'running' && checkVisible) || slowSince !== null) return 'waking';
  if (checkPhase === 'running') return 'checking';
  return 'ready';
};

const update = () => {
  const prev = snapshot.status;
  const status = deriveStatus();

  if (status === 'waking' && waitStartedAt === null) {
    waitStartedAt = Math.min(...[checkPhase === 'running' ? checkStartedAt : null, slowSince].filter((t) => t !== null));
  }
  if (status === 'ready' || status === 'checking') waitStartedAt = null;

  if (status === 'ready' && prev === 'waking') {
    celebrating = true;
    reloading = reloadWhenReady;
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(() => {
      celebrateTimer = null;
      if (reloading) {
        window.location.reload(); // keep the card up until the page goes
        return;
      }
      celebrating = false;
      update();
    }, CELEBRATE_MS);
  } else if (status !== 'ready') {
    celebrating = false;
    reloading = false;
    clearTimeout(celebrateTimer);
    celebrateTimer = null;
  }
  if (status === 'ready') reloadWhenReady = false;

  // Tick elapsedSeconds once a second while waiting
  if (status === 'waking' && !tickTimer) {
    tickTimer = setInterval(update, 1000);
  } else if (status !== 'waking' && tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }

  const elapsedSeconds = status === 'waking' || status === 'failed'
    ? Math.max(0, Math.floor((Date.now() - (waitStartedAt ?? Date.now())) / 1000))
    : 0;
  if (
    status !== snapshot.status || elapsedSeconds !== snapshot.elapsedSeconds ||
    celebrating !== snapshot.celebrating || reloading !== snapshot.reloading
  ) {
    snapshot = status === 'ready' && !celebrating ? READY : { status, elapsedSeconds, celebrating, reloading };
    listeners.forEach((fn) => fn());
  }
};

const startCheck = ({ visible, startedAt = Date.now() }) => {
  activeCheck?.abort();
  clearTimeout(quietTimer);
  const controller = new AbortController();
  activeCheck = controller;
  checkPhase = 'running';
  checkVisible = visible;
  checkStartedAt = startedAt;
  if (!visible) {
    quietTimer = setTimeout(() => {
      if (activeCheck !== controller) return;
      checkVisible = true;
      update();
    }, Math.max(0, QUIET_MS - (Date.now() - startedAt)));
  }
  update();

  waitForServer(controller.signal, startedAt + WAKE_TIMEOUT_MS).then((ok) => {
    if (activeCheck !== controller) return; // aborted or superseded
    activeCheck = null;
    clearTimeout(quietTimer);
    checkPhase = ok ? 'idle' : 'failed';
    update();
  });
};

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getSnapshot = () => snapshot;

// First app load: ping /api/health; the banner appears only if it is still waiting after QUIET_MS.
// Returns a cleanup that aborts the check (StrictMode mounts effects twice).
let bootStartedAt = null;
export const startBootCheck = () => {
  if (bootStartedAt === null) bootStartedAt = Date.now();
  startCheck({ visible: false, startedAt: bootStartedAt });
  return stopCheck;
};

export const stopCheck = () => {
  activeCheck?.abort();
  activeCheck = null;
  clearTimeout(quietTimer);
  if (checkPhase === 'running') checkPhase = 'idle';
  update();
};

// "Try again" after a failed wake-up. Pages have already shown their errors by then, so once the
// server answers we reload to fetch everything fresh.
export const retry = () => {
  reloadWhenReady = true;
  waitStartedAt = null;
  startCheck({ visible: true });
};

// Hide the failure card without retrying.
export const dismiss = () => {
  if (checkPhase !== 'failed') return;
  checkPhase = 'idle';
  slowSince = null;
  update();
};

// ---- axios request tracking -----------------------------------------------------------------

// Called from axiosClient's request interceptor. Requests with `skipWakeBanner: true` (code
// execution, AI tutor, admin problem save) have their own progress UI and are not tracked.
export const trackRequestStart = (config) => {
  if (config.skipWakeBanner || config.__wakeTimer !== undefined) return;
  pending += 1;
  const startedAt = Date.now();
  config.__wakeTimer = setTimeout(() => {
    config.__wakeTimer = null; // fired; the request is still pending
    if (slowSince !== null) return;
    slowSince = startedAt;
    // Check whether the server is actually up, so a dead server ends in "Try again", not a spinner.
    if (checkPhase === 'idle') startCheck({ visible: true, startedAt });
    else update();
  }, SLOW_REQUEST_MS);
};

// Called from axiosClient's response and error interceptors.
export const trackRequestEnd = (config) => {
  if (!config || config.__wakeTimer === undefined || config.__wakeDone) return;
  config.__wakeDone = true;
  clearTimeout(config.__wakeTimer);
  pending = Math.max(0, pending - 1);
  if (pending === 0 && slowSince !== null) {
    slowSince = null;
    update();
  }
};

// Test helper: back to a clean slate.
export const resetServerWakeForTests = () => {
  activeCheck?.abort();
  activeCheck = null;
  [quietTimer, celebrateTimer].forEach(clearTimeout);
  clearInterval(tickTimer);
  tickTimer = null;
  celebrateTimer = null;
  checkPhase = 'idle';
  checkVisible = false;
  checkStartedAt = null;
  reloadWhenReady = false;
  pending = 0;
  slowSince = null;
  celebrating = false;
  reloading = false;
  waitStartedAt = null;
  bootStartedAt = null;
  snapshot = READY;
};
