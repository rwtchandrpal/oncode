// Per-problem, per-language editor drafts in localStorage (UX-05). Storage can be unavailable
// (private mode, quota, blocked site data), so every access is guarded and failures are ignored.
const keyFor = (problemId, language) => `oncode:code:${problemId}:${language}`;

export const loadDraft = (problemId, language) => {
  try {
    return localStorage.getItem(keyFor(problemId, language));
  } catch {
    return null;
  }
};

export const saveDraft = (problemId, language, code) => {
  try {
    localStorage.setItem(keyFor(problemId, language), code);
  } catch {
    // ignore: drafts are a convenience
  }
};

export const clearDraft = (problemId, language) => {
  try {
    localStorage.removeItem(keyFor(problemId, language));
  } catch {
    // ignore
  }
};
