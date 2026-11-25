import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logoutUser, sessionCleared, openAuthModal } from '../features/auth/authSlice';
import axiosClient, { setupInterceptors } from '../utils/axiosClient';

const signedInState = () => ({
  auth: {
    user: { _id: 'u1', firstName: 'Test', role: 'user' },
    isAuthenticated: true,
    isCheckingAuth: false,
    isLoading: false,
    error: null,
    authModal: { isOpen: false, mode: 'login', redirectPath: null },
  },
});

const makeStore = () => configureStore({ reducer: { auth: authReducer }, preloadedState: signedInState() });

// Replaces the network layer: every request fails with the given status.
const failWith = (status) => {
  axiosClient.defaults.adapter = (config) =>
    Promise.reject(Object.assign(new Error(`HTTP ${status}`), {
      config,
      response: { status, data: { error: { code: 'X', message: `status ${status}` } }, headers: {}, config },
    }));
};

describe('authSlice (BUG-08)', () => {
  it('sessionCleared signs the user out locally', () => {
    const state = authReducer(signedInState().auth, sessionCleared());
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('a failed logout still clears the session', async () => {
    const store = makeStore();
    localStorage.setItem('token', 'abc');
    failWith(401);
    await store.dispatch(logoutUser());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('axios 401 interceptor (BUG-07)', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
    setupInterceptors(store, { sessionCleared, openAuthModal });
    localStorage.setItem('token', 'expired-token');
    window.history.pushState({}, '', '/profile');
  });

  it('a 401 on a normal request clears the token and Redux session and opens the sign-in modal', async () => {
    failWith(401);
    await expect(axiosClient.get('/user/profile')).rejects.toBeTruthy();
    expect(localStorage.getItem('token')).toBeNull();
    const { auth } = store.getState();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.authModal).toMatchObject({ isOpen: true, mode: 'login', redirectPath: '/profile' });
  });

  it('a 401 from login (wrong password) does not touch the session or open the modal', async () => {
    failWith(401);
    await expect(axiosClient.post('/user/login', {})).rejects.toBeTruthy();
    expect(store.getState().auth.authModal.isOpen).toBe(false);
    expect(localStorage.getItem('token')).toBe('expired-token');
  });

  it('other errors (e.g. 503) keep the session', async () => {
    failWith(503);
    await expect(axiosClient.get('/user/profile')).rejects.toBeTruthy();
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('expired-token');
  });

  it('run/submit requests get a 60 s timeout', async () => {
    let seen;
    axiosClient.defaults.adapter = async (config) => { seen = config.timeout; return { data: {}, status: 200, headers: {}, config }; };
    await axiosClient.post('/submission/run/x', {});
    expect(seen).toBe(60000);
  });
});
