import axios from 'axios'

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    headers :{
        'Content-Type': 'application/json'
    }
});

// Run/Submit wait on the code runner; give up after 60 s with a clear message (BUG-18).
export const EXECUTION_TIMEOUT_MS = 60000;
const EXECUTION_TIMEOUT_MESSAGE = "The code runner took too long to respond. Please try again in a moment.";

// 401s on these endpoints mean "wrong credentials" or "already signed out", not "session expired".
const AUTH_ENDPOINTS = ['/user/login', '/user/register', '/user/demo', '/user/logout'];
const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some((p) => url.startsWith(p));

// Interceptor to attach token to every request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.url?.startsWith('/submission/') && !config.timeout) {
        config.timeout = EXECUTION_TIMEOUT_MS;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// The store is injected from main.jsx (setupInterceptors) because authSlice imports this module,
// so importing the store or slice here would be circular.
let injected = null;

export const setupInterceptors = (store, { sessionCleared, openAuthModal }) => {
    injected = { store, sessionCleared, openAuthModal };
};

// Response interceptor: a 401 means the session is gone (expired, revoked or account deleted).
// Clear it everywhere, not only in localStorage, and ask the user to sign in again (BUG-07).
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        if (error.response?.status === 401 && !isAuthEndpoint(url)) {
            const hadToken = !!localStorage.getItem('token');
            localStorage.removeItem('token');
            if (injected) {
                const { store, sessionCleared, openAuthModal } = injected;
                const wasSignedIn = store.getState().auth.isAuthenticated;
                store.dispatch(sessionCleared());
                // Boot-time /user/check failures are handled by checkAuth; don't pop the modal for them.
                if ((hadToken || wasSignedIn) && !url.startsWith('/user/check')) {
                    store.dispatch(openAuthModal({ mode: 'login', redirectPath: window.location.pathname }));
                }
            }
        }
        if (!error.response && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') && url.startsWith('/submission/')) {
            error.userMessage = EXECUTION_TIMEOUT_MESSAGE;
        }
        return Promise.reject(error);
    }
);

export default axiosClient ;
