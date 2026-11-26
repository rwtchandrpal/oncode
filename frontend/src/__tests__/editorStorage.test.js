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
