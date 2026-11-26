// Guest mode token storage (docs/GUEST_MODE_DESIGN.md). The guest token lives in its own
// localStorage key, separate from the user `token`, so the two sessions can never be confused.
// localStorage (not sessionStorage) on purpose: a refresh or a second tab is the same guest session.
export const GUEST_TOKEN_KEY = 'guestToken';

export const readGuestToken = () => {
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveGuestToken = (token) => {
  try {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  } catch {
    // ignore: the session then lasts only until reload
  }
};

export const clearGuestToken = () => {
  try {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {
    // ignore
  }
};

// Reads `exp` from a JWT without verifying it. For UI only (restore on boot, countdown); the server
// always verifies the token.
export const decodeTokenExpiry = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

// The stored guest session's random id (the token's `gid`), or null. UI only, like decodeTokenExpiry.
export const readGuestId = () => {
  try {
    const payload = readGuestToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { gid } = JSON.parse(atob(payload));
    return typeof gid === 'string' ? gid : null;
  } catch {
    return null;
  }
};

// The guest session stored in this browser, or null. An expired or unreadable token is removed.
export const readActiveGuestSession = () => {
  const token = readGuestToken();
  if (!token) return null;
  const expiresAtMs = decodeTokenExpiry(token);
  if (!expiresAtMs || expiresAtMs <= Date.now()) {
    clearGuestToken();
    return null;
  }
  return { expiresAt: new Date(expiresAtMs).toISOString() };
};
