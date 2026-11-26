import { describe, it, expect, beforeEach } from 'vitest';
import { loadDraft, saveDraft, clearDraft, purgeLegacyDrafts } from '../utils/editorStorage';

const PID = '6b08156c71be629dc459be3a';

describe('editor drafts are scoped to the account that wrote them', () => {
  beforeEach(() => localStorage.clear());

  it('another account or a guest on the same browser does not see the draft', () => {
    saveDraft('user-a', PID, 'cpp', 'secret code of A');
    expect(loadDraft('user-a', PID, 'cpp')).toBe('secret code of A');
    expect(loadDraft('user-b', PID, 'cpp')).toBeNull();
    expect(loadDraft('guest-123', PID, 'cpp')).toBeNull();
  });

  it('without an owner nothing is read or written', () => {
    saveDraft(null, PID, 'cpp', 'x');
    expect(Object.keys(localStorage)).toHaveLength(0);
    expect(loadDraft(null, PID, 'cpp')).toBeNull();
  });

  it('clearDraft removes only that owner\'s draft', () => {
    saveDraft('user-a', PID, 'cpp', 'a');
    saveDraft('user-b', PID, 'cpp', 'b');
    clearDraft('user-a', PID, 'cpp');
    expect(loadDraft('user-a', PID, 'cpp')).toBeNull();
    expect(loadDraft('user-b', PID, 'cpp')).toBe('b');
  });

  it('purges unscoped drafts from before scoping, keeps scoped ones and other keys', () => {
    localStorage.setItem(`oncode:code:${PID}:cpp`, 'legacy');
    localStorage.setItem('token', 't');
    saveDraft('user-a', PID, 'java', 'kept');
    purgeLegacyDrafts();
    expect(localStorage.getItem(`oncode:code:${PID}:cpp`)).toBeNull();
    expect(localStorage.getItem('token')).toBe('t');
    expect(loadDraft('user-a', PID, 'java')).toBe('kept');
  });
});

describe('a guest who signs up or logs in keeps the guest session\'s drafts', () => {
  beforeEach(() => localStorage.clear());

  it('adoptDrafts moves the guest drafts to the account without overwriting its own', async () => {
    const { adoptDrafts } = await import('../utils/editorStorage');
    saveDraft('guest-g1', PID, 'cpp', 'guest cpp');
    saveDraft('guest-g1', PID, 'java', 'guest java');
    saveDraft('user-a', PID, 'java', 'account java');
    adoptDrafts('guest-g1', 'user-a');
    expect(loadDraft('user-a', PID, 'cpp')).toBe('guest cpp');
    expect(loadDraft('user-a', PID, 'java')).toBe('account java');
    expect(loadDraft('guest-g1', PID, 'cpp')).toBeNull();
  });

  it('loginUser moves them as part of leaving guest mode', async () => {
    const { configureStore } = await import('@reduxjs/toolkit');
    const { default: authReducer, loginUser } = await import('../features/auth/authSlice');
    const { default: axiosClient } = await import('../utils/axiosClient');
    const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    localStorage.setItem('guestToken', `${b64({ alg: 'HS256' })}.${b64({ typ: 'guest', gid: 'g1', exp: 9999999999 })}.sig`);
    saveDraft('guest-g1', PID, 'cpp', 'written as a guest');
    axiosClient.defaults.adapter = async (config) => ({ status: 200, statusText: 'OK', headers: {}, config, data: { token: 't', user: { _id: 'user-a', role: 'user' } } });
    const store = configureStore({ reducer: { auth: authReducer } });
    await store.dispatch(loginUser({ email: 'a@b.c', password: 'x' }));
    expect(localStorage.getItem('guestToken')).toBeNull();
    expect(loadDraft('user-a', PID, 'cpp')).toBe('written as a guest');
  });
});
