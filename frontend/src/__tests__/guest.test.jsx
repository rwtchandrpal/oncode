// Guest mode on the client: state, token storage, interceptors,
// the auth modal's guest option, the guest notice, the navbar reminder and route guards.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  startGuestSession,
  loginUser,
  syncAuthFromStorage,
  sessionCleared,
  openAuthModal,
  guestSessionEnded,
} from '../features/auth/authSlice';
import axiosClient, { setupInterceptors } from '../utils/axiosClient';
import { readActiveGuestSession, GUEST_TOKEN_KEY } from '../utils/guestSession';
import AuthModal from '../components/AuthModal';
import GuestNotice, { GUEST_NOTICE_TEXT } from '../components/GuestNotice';
import GlobalNavbar from '../components/GlobalNavbar';
import { ProtectedRoute, SolveRoute } from '../App';

const HOUR = 60 * 60;
const fakeJwt = (expSeconds) =>
  `h.${btoa(JSON.stringify({ typ: 'guest', gid: 'a'.repeat(32), exp: expSeconds })).replace(/=+$/, '')}.s`;
const nowSeconds = () => Math.floor(Date.now() / 1000);

const baseAuth = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: false,
  isLoading: false,
  error: null,
  isGuest: false,
  guest: null,
  guestNoticeOpen: false,
  authModal: { isOpen: false, mode: 'login', redirectPath: null, notice: null },
  ...overrides,
});
const guestAuth = (overrides = {}) =>
  baseAuth({ isGuest: true, guest: { expiresAt: new Date(Date.now() + 4 * HOUR * 1000).toISOString() }, ...overrides });

const makeStore = (auth = baseAuth()) => configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });

// Replaces the network layer. `routes` maps "METHOD url" to [status, body].
const stubApi = (routes) => {
  const seen = [];
  axiosClient.defaults.adapter = async (config) => {
    seen.push(config);
    const [status, data] = routes[`${config.method.toUpperCase()} ${config.url}`] || [404, { error: { code: 'NOT_FOUND', message: 'nf' } }];
    if (status >= 400) {
      return Promise.reject(Object.assign(new Error(`HTTP ${status}`), { config, response: { status, data, headers: {}, config } }));
    }
    return { data, status, headers: {}, config };
  };
  return seen;
};

const renderWithStore = (ui, store, initialEntries = ['/']) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </Provider>
  );

beforeEach(() => {
  localStorage.clear();
});
afterEach(cleanup);

describe('guest session state', () => {
  it('starting a session stores the guest token, enters guest mode and opens the notice', async () => {
    const token = fakeJwt(nowSeconds() + 4 * HOUR);
    const expiresAt = new Date(Date.now() + 4 * HOUR * 1000).toISOString();
    stubApi({ 'POST /user/guest': [201, { token, guest: { expiresAt } }] });
    const store = makeStore();
    await store.dispatch(startGuestSession());
    const { auth } = store.getState();
    expect(auth.isGuest).toBe(true);
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.guest.expiresAt).toBe(expiresAt);
    expect(auth.guestNoticeOpen).toBe(true);
    expect(localStorage.getItem(GUEST_TOKEN_KEY)).toBe(token);
  });

  it('logging in leaves guest mode and forgets the guest token', async () => {
    localStorage.setItem(GUEST_TOKEN_KEY, fakeJwt(nowSeconds() + HOUR));
    stubApi({ 'POST /user/login': [200, { token: 'user-token', user: { _id: 'u1', firstName: 'T', role: 'user' } }] });
    const store = makeStore(guestAuth());
    await store.dispatch(loginUser({ email: 'a@b.co', password: 'x' }));
    const { auth } = store.getState();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isGuest).toBe(false);
    expect(localStorage.getItem(GUEST_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem('token')).toBe('user-token');
  });

  it('restores an unexpired guest session and drops an expired one', () => {
    localStorage.setItem(GUEST_TOKEN_KEY, fakeJwt(nowSeconds() + HOUR));
    expect(readActiveGuestSession()).not.toBeNull();
    localStorage.setItem(GUEST_TOKEN_KEY, fakeJwt(nowSeconds() - 5));
    expect(readActiveGuestSession()).toBeNull();
    expect(localStorage.getItem(GUEST_TOKEN_KEY)).toBeNull();
  });

  it('another tab starting or ending guest mode is picked up', () => {
    const store = makeStore();
    localStorage.setItem(GUEST_TOKEN_KEY, fakeJwt(nowSeconds() + HOUR));
    store.dispatch(syncAuthFromStorage());
    expect(store.getState().auth.isGuest).toBe(true);
    localStorage.removeItem(GUEST_TOKEN_KEY);
    store.dispatch(syncAuthFromStorage());
    expect(store.getState().auth.isGuest).toBe(false);
  });
});

describe('HTTP client in guest mode', () => {
  let store;
  beforeEach(() => {
    store = makeStore(guestAuth());
    setupInterceptors(store, { sessionCleared, openAuthModal, guestSessionEnded });
    localStorage.setItem(GUEST_TOKEN_KEY, 'guest-token');
    window.history.pushState({}, '', '/problems/two-sum');
  });

  it('sends the guest token when there is no user token', async () => {
    const seen = stubApi({ 'GET /problem/p1': [200, {}] });
    await axiosClient.get('/problem/p1');
    expect(seen[0].headers.Authorization).toBe('Bearer guest-token');
  });

  it('a 401 ends guest mode and offers a new guest session', async () => {
    stubApi({ 'POST /submission/run/p1': [401, { error: { code: 'UNAUTHENTICATED', message: 'expired' } }] });
    await expect(axiosClient.post('/submission/run/p1', {})).rejects.toBeTruthy();
    const { auth } = store.getState();
    expect(auth.isGuest).toBe(false);
    expect(localStorage.getItem(GUEST_TOKEN_KEY)).toBeNull();
    expect(auth.authModal).toMatchObject({ isOpen: true, mode: 'guest-expired', redirectPath: '/problems/two-sum' });
  });

  it('403 GUEST_NOT_ALLOWED keeps the guest session and offers sign-up; locked content does not', async () => {
    stubApi({
      'GET /user/profile': [403, { error: { code: 'GUEST_NOT_ALLOWED', message: 'no' } }],
      'GET /problem/p1/solution': [403, { isLocked: true, error: { code: 'GUEST_NOT_ALLOWED', message: 'locked' } }],
    });
    await expect(axiosClient.get('/problem/p1/solution')).rejects.toBeTruthy();
    expect(store.getState().auth.authModal.isOpen).toBe(false);

    await expect(axiosClient.get('/user/profile')).rejects.toBeTruthy();
    const { auth } = store.getState();
    expect(auth.isGuest).toBe(true);
    expect(localStorage.getItem(GUEST_TOKEN_KEY)).toBe('guest-token');
    expect(auth.authModal).toMatchObject({ isOpen: true, mode: 'signup' });
  });
});

describe('auth modal: sign up, log in, or continue as guest', () => {
  const openModal = () => makeStore(baseAuth({ authModal: { isOpen: true, mode: 'login', redirectPath: '/problems/two-sum', notice: null } }));

  it('offers all three options and says progress is not saved', () => {
    renderWithStore(<AuthModal />, openModal());
    // Sign Up appears as a tab and as a footer link
    expect(screen.getAllByRole('button', { name: /^sign up$/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /continue as guest/i })).toBeTruthy();
    expect(screen.getByText(/your progress won't be saved/i)).toBeTruthy();
    expect(screen.queryByText(/demo/i)).toBeNull();
  });

  it('one click starts a guest session and goes to the problem', async () => {
    stubApi({ 'POST /user/guest': [201, { token: fakeJwt(nowSeconds() + 4 * HOUR), guest: { expiresAt: new Date().toISOString() } }] });
    const store = openModal();
    const Where = () => <span data-testid="where">{useLocation().pathname}</span>;
    renderWithStore(
      <>
        <AuthModal />
        <Routes>
          <Route path="*" element={<Where />} />
        </Routes>
      </>,
      store
    );
    fireEvent.click(screen.getByRole('button', { name: /continue as guest/i }));
    await waitFor(() => expect(store.getState().auth.isGuest).toBe(true));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/problems/two-sum'));
    expect(store.getState().auth.authModal.isOpen).toBe(false);
  });

  it('a current guest who opens the dialog is offered sign up / log in, not another guest session', () => {
    renderWithStore(<AuthModal />, makeStore(guestAuth({ authModal: { isOpen: true, mode: 'signup', redirectPath: '/', notice: null } })));
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /continue as guest/i })).toBeNull();
  });

  it('after a guest session ends it offers to start a new one', () => {
    renderWithStore(<AuthModal />, makeStore(baseAuth({ authModal: { isOpen: true, mode: 'guest-expired', redirectPath: '/', notice: null } })));
    expect(screen.getByRole('heading', { name: /guest session ended/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /start a new guest session/i })).toBeTruthy();
  });
});

describe('guest notice and navbar reminder', () => {
  it('the notice shows the required message with sign-up and log-in', () => {
    const store = makeStore(guestAuth({ guestNoticeOpen: true }));
    renderWithStore(<GuestNotice />, store);
    expect(GUEST_NOTICE_TEXT).toBe("You're in guest mode. Your progress won't be saved. Sign up or log in to save your progress.");
    expect(screen.getByRole('status').textContent).toContain(GUEST_NOTICE_TEXT);
    fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));
    expect(store.getState().auth.guestNoticeOpen).toBe(false);
    expect(store.getState().auth.authModal).toMatchObject({ isOpen: true, mode: 'signup' });
  });

  it('the navbar shows a guest badge with sign-up and log-in', () => {
    const store = makeStore(guestAuth());
    renderWithStore(<GlobalNavbar />, store);
    const badge = screen.getByRole('button', { name: /open guest menu/i });
    expect(badge.textContent.trim()).toBe('Guest');
    expect(screen.queryByRole('button', { name: /get started/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));
    expect(store.getState().auth.authModal).toMatchObject({ isOpen: true, mode: 'login' });
  });
});

describe('route guards', () => {
  const ShowState = () => <span data-testid="state">{JSON.stringify(useLocation().state)}</span>;
  const routes = (props) => (
    <Routes>
      <Route path="/" element={<ShowState />} />
      <Route path="/problems/:slug" element={<SolveRoute {...props}><span>workspace</span></SolveRoute>} />
      <Route path="/profile" element={<ProtectedRoute {...props}><span>profile</span></ProtectedRoute>} />
    </Routes>
  );

  it('a guest can open the workspace', () => {
    renderWithStore(routes({ isAuthenticated: false, isGuest: true }), makeStore(guestAuth()), ['/problems/two-sum']);
    expect(screen.getByText('workspace')).toBeTruthy();
  });

  it('a guest is sent from /profile to sign-up', () => {
    renderWithStore(routes({ isAuthenticated: false, isGuest: true }), makeStore(guestAuth()), ['/profile']);
    const state = JSON.parse(screen.getByTestId('state').textContent);
    expect(state).toMatchObject({ openAuthModal: true, from: '/profile', mode: 'signup' });
  });

  it('an anonymous visitor still cannot open the workspace', () => {
    renderWithStore(routes({ isAuthenticated: false, isGuest: false }), makeStore(), ['/problems/two-sum']);
    expect(screen.queryByText('workspace')).toBeNull();
    expect(JSON.parse(screen.getByTestId('state').textContent)).toMatchObject({ openAuthModal: true, from: '/problems/two-sum' });
  });
});
