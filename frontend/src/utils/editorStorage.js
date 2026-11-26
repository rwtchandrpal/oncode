// Per-account, per-problem, per-language editor drafts in localStorage (UX-05). Storage can be unavailable
// (private mode, quota, blocked site data), so every access is guarded and failures are ignored.
//
// Drafts are scoped to the account that wrote them (`owner`: the user's _id, or `guest-<id>` for a guest
// session). Unscoped keys let the next person on a shared browser (another account, or a guest) open a
// problem and see the previous user's code.
const PREFIX = 'oncode:code:';
const keyFor = (owner, problemId, language) => `${PREFIX}${owner}:${problemId}:${language}`;
// Pre-scoping format: oncode:code:<problemId>:<language>
const LEGACY_KEY = /^oncode:code:[a-f0-9]{24}:[a-z]+$/i;

export const loadDraft = (owner, problemId, language) => {
  if (!owner) return null;
  try {
    return localStorage.getItem(keyFor(owner, problemId, language));
  } catch {
    return null;
  }
};

export const saveDraft = (owner, problemId, language, code) => {
  if (!owner) return;
  try {
    localStorage.setItem(keyFor(owner, problemId, language), code);
  } catch {
    // ignore: drafts are a convenience
  }
};

export const clearDraft = (owner, problemId, language) => {
  if (!owner) return;
  try {
    localStorage.removeItem(keyFor(owner, problemId, language));
  } catch {
    // ignore
  }
};

// A guest who signs up or logs in keeps the code written in that guest session: its drafts move to the
// account (an existing draft of the account for the same problem and language wins).
export const adoptDrafts = (fromOwner, toOwner) => {
  if (!fromOwner || !toOwner || fromOwner === toOwner) return;
  try {
    const from = `${PREFIX}${fromOwner}:`;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(from))
      .forEach((k) => {
        const target = `${PREFIX}${toOwner}:${k.slice(from.length)}`;
        if (localStorage.getItem(target) === null) localStorage.setItem(target, localStorage.getItem(k));
        localStorage.removeItem(k);
      });
  } catch {
    // ignore
  }
};

// Removes drafts saved before they were scoped to an account: nobody can tell whose they are.
export const purgeLegacyDrafts = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => LEGACY_KEY.test(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};
