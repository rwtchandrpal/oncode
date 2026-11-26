import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import {
  getSnapshot, startBootCheck, trackRequestStart, trackRequestEnd, retry, resetServerWakeForTests,
  QUIET_MS, SLOW_REQUEST_MS, WAKE_TIMEOUT_MS, CELEBRATE_MS,
} from '../utils/serverWake';
import ServerStatusProvider from '../features/serverStatus/ServerStatusProvider';
import ServerWakeBanner from '../components/ServerWakeBanner';

// fetch that answers with `status` after `delayMs` (or never, for a hung cold start)
const mockFetch = (impl) => {
  globalThis.fetch = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    impl(resolve, reject);
  }));
};
const respondAfter = (delayMs, status = 200) => mockFetch((resolve) => setTimeout(() => resolve({ status }), delayMs));

const flush = async (ms) => {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
};

describe('server wake-up banner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetServerWakeForTests();
  });
  afterEach(() => {
    cleanup();
    resetServerWakeForTests();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('stays silent when /api/health answers quickly', async () => {
    respondAfter(300);
    render(<ServerStatusProvider><ServerWakeBanner /></ServerStatusProvider>);
    expect(getSnapshot().status).toBe('checking');
    await flush(400);
    expect(getSnapshot().status).toBe('ready');
    await flush(QUIET_MS);
    expect(screen.queryByRole('status')).toBeNull();
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/health$/);
  });

  it('shows the banner after the quiet period, then celebrates and hides', async () => {
    respondAfter(8000);
    render(<ServerStatusProvider><ServerWakeBanner /></ServerStatusProvider>);
    await flush(QUIET_MS + 100);
    expect(getSnapshot().status).toBe('waking');
    expect(screen.getByText(/Waking up the server/)).toBeTruthy();
    await flush(6000);
    expect(screen.getByText(/You're all set/)).toBeTruthy();
    await flush(CELEBRATE_MS + 50);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('retries on 503 and network errors until the server answers', async () => {
    let calls = 0;
    mockFetch((resolve, reject) => {
      calls += 1;
      if (calls === 1) setTimeout(() => resolve({ status: 503 }), 100);
      else if (calls === 2) setTimeout(() => reject(new TypeError('Failed to fetch')), 100);
      else setTimeout(() => resolve({ status: 200 }), 100);
    });
    const stop = startBootCheck();
    await flush(7000); // 100 + 3000 + 100 + 3000 + 100 ms, then inside the 1.5 s "all set"
    expect(calls).toBe(3);
    expect(getSnapshot().celebrating).toBe(true);
    stop();
  });

  it('gives up after the timeout with a Try again button', async () => {
    mockFetch(() => {}); // never answers
    render(<ServerStatusProvider><ServerWakeBanner /></ServerStatusProvider>);
    await flush(WAKE_TIMEOUT_MS + 1000);
    expect(getSnapshot().status).toBe('failed');
    expect(screen.getByRole('button', { name: /Try again/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('retry() reloads the page once the server is back', async () => {
    mockFetch(() => {});
    const stop = startBootCheck();
    await flush(WAKE_TIMEOUT_MS + 1000);
    expect(getSnapshot().status).toBe('failed');
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload });
    respondAfter(100);
    act(() => retry());
    expect(getSnapshot().status).toBe('waking');
    await flush(200);
    expect(getSnapshot().reloading).toBe(true);
    await flush(CELEBRATE_MS);
    expect(reload).toHaveBeenCalled();
    stop();
  });

  it('shows for API requests pending over 3 s and hides when they finish', async () => {
    respondAfter(10); // server is up; the request itself is slow
    const a = {};
    const b = {};
    trackRequestStart(a);
    trackRequestStart(b);
    await flush(SLOW_REQUEST_MS - 100);
    expect(getSnapshot().status).toBe('ready');
    await flush(200);
    expect(getSnapshot().status).toBe('waking');
    trackRequestEnd(a);
    await flush(50);
    expect(getSnapshot().status).toBe('waking'); // b still pending: no flicker
    trackRequestEnd(b);
    expect(getSnapshot().celebrating).toBe(true);
  });

  it('ignores requests marked skipWakeBanner and fast requests', async () => {
    respondAfter(10);
    const run = { skipWakeBanner: true };
    trackRequestStart(run);
    const fast = {};
    trackRequestStart(fast);
    await flush(500);
    trackRequestEnd(fast);
    await flush(SLOW_REQUEST_MS * 2);
    expect(getSnapshot().status).toBe('ready');
    expect(fetch).not.toHaveBeenCalled();
  });
});
