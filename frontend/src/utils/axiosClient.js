import axios from 'axios'
import { clearGuestToken, readGuestToken } from './guestSession';
import { getApiErrorCode } from './apiError';
import { API_BASE_URL } from './apiBase';
import { trackRequestStart, trackRequestEnd } from './serverWake';

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers :{
        'Content-Type': 'application/json'
    }
});

// Run/Submit wait on the code runner; give up after 60 s with a clear message (BUG-18).
export const EXECUTION_TIMEOUT_MS = 60000;
const EXECUTION_TIMEOUT_MESSAGE = "The code runner took too long to respond. Please try again in a moment.";

// 401s on these endpoints mean "wrong credentials" or "already signed out", not "session expired".
const AUTH_ENDPOINTS = ['/user/login', '/user/register', '/user/guest', '/user/logout'];
const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some((p) => url.startsWith(p));

// Interceptor to attach token to every request: the user's token, otherwise the guest session's
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || readGuestToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.url?.startsWith('/submission/') && !config.timeout) {
        config.timeout = EXECUTION_TIMEOUT_MS;
    }
    // Show the "server waking up" banner if this request hangs (opt out with skipWakeBanner: true)
    trackRequestStart(config);
    return config;
}, (error) => {
    return Promise.reject(error);
});

// The store is injected from main.jsx (setupInterceptors) because authSlice imports this module,
// so importing the store or slice here would be circular.
let injected = null;

export const setupInterceptors = (store, { sessionCleared, openAuthModal, guestSessionEnded }) => {
    injected = { store, sessionCleared, openAuthModal, guestSessionEnded };
};

// Response interceptor: a 401 means the session is gone (expired, revoked or account deleted).
// Clear it everywhere, not only in localStorage, and ask the user to sign in again (BUG-07).
// For a guest it means the guest session ended: offer a new one (or sign up / log in).
axiosClient.interceptors.response.use(
    (response) => {
        trackRequestEnd(response.config);
        return response;
    },
    (error) => {
        trackRequestEnd(error.config);
        const url = error.config?.url || '';
        if (error.response?.status === 401 && !isAuthEndpoint(url)) {
            const hadToken = !!localStorage.getItem('token');
            const hadGuestToken = !hadToken && !!readGuestToken();
            localStorage.removeItem('token');
            if (hadGuestToken) clearGuestToken();
            if (injected) {
                const { store, sessionCleared, openAuthModal, guestSessionEnded } = injected;
                const { isAuthenticated: wasSignedIn, isGuest: wasGuest } = store.getState().auth;
                if ((hadGuestToken || wasGuest) && guestSessionEnded) {
                    store.dispatch(guestSessionEnded());
                    store.dispatch(openAuthModal({ mode: 'guest-expired', redirectPath: window.location.pathname }));
                } else {
                    store.dispatch(sessionCleared());
                    // Boot-time /user/check failures are handled by checkAuth; don't pop the modal for them.
                    if ((hadToken || wasSignedIn) && !url.startsWith('/user/check')) {
                        store.dispatch(openAuthModal({ mode: 'login', redirectPath: window.location.pathname }));
                    }
                }
            }
        }
        // A guest reached a user-only feature: keep the guest session and offer sign-up. Locked
        // content (isLocked, e.g. official solutions) is shown in place instead.
        if (
            error.response?.status === 403 &&
            getApiErrorCode(error) === 'GUEST_NOT_ALLOWED' &&
            !error.response.data?.isLocked &&
            injected
        ) {
            injected.store.dispatch(injected.openAuthModal({
                mode: 'signup',
                redirectPath: window.location.pathname,
                notice: 'Sign up or log in to use this feature.'
            }));
        }
        if (!error.response && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') && url.startsWith('/submission/')) {
            error.userMessage = EXECUTION_TIMEOUT_MESSAGE;
        }
        return Promise.reject(error);
    }
);

export default axiosClient ;
