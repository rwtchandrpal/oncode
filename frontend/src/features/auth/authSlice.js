import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../../utils/axiosClient';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearGuestToken, readActiveGuestSession, saveGuestToken } from '../../utils/guestSession';

// Helper to handle axios errors consistently
export const handleAxiosError = (error, rejectWithValue) => {
    if (error.response) {
        const backendMessage = getApiErrorMessage(error, 'Server rejected the request.');
        return rejectWithValue(backendMessage);
    } 
    if (error.request) {
        return rejectWithValue('Network error: No response from the server. Please try again.');
    }
    return rejectWithValue(error.message || 'An unexpected error occurred.');
};

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, {rejectWithValue}) => {
        try {
            const response = await axiosClient.post('/user/register', userData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                clearGuestToken(); // a guest who signs up leaves guest mode; guest work is discarded
            }
            return response.data.user;
        } catch (error) {
            return handleAxiosError(error, rejectWithValue);
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post('/user/login', credentials);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                clearGuestToken(); // a guest who logs in leaves guest mode; guest work is discarded
            }
            return response.data.user;
        } catch(error) {
            return handleAxiosError(error, rejectWithValue);
        }
    }
);

// Guest mode: a one-click session without an account. Nothing is saved to a profile.
export const startGuestSession = createAsyncThunk(
    'auth/guestStart',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.post('/user/guest');
            saveGuestToken(data.token);
            return data.guest;
        } catch (error) {
            return handleAxiosError(error, rejectWithValue);
        }
    }
);

// Exit guest mode: revoke the guest token on the server (best effort) and forget it locally.
export const endGuestSession = createAsyncThunk(
    'auth/guestEnd',
    async () => {
        try {
            await axiosClient.post('/user/logout');
        } catch {
            // The token expires on its own; leaving guest mode must always succeed locally.
        } finally {
            clearGuestToken();
        }
        return null;
    }
);

export const checkAuth = createAsyncThunk(
    'auth/check',
    async (_, { rejectWithValue }) => {
        const token = localStorage.getItem('token');
        if (!token) {
            return rejectWithValue('No authentication token found');
        }
        try {
            const { data } = await axiosClient.get('/user/check');
            return data.user;
        } catch (error) {
            localStorage.removeItem('token');
            return handleAxiosError(error, rejectWithValue);
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await axiosClient.post('/user/logout');
            localStorage.removeItem('token');
            return null;
        } catch (error) {
            localStorage.removeItem('token'); // ensure it's cleared even if backend call fails
            return handleAxiosError(error, rejectWithValue);
        }
    }
);

// Leaves guest mode in Redux (the token itself is handled by the caller)
const clearGuestState = (state) => {
    state.isGuest = false;
    state.guest = null;
    state.guestNoticeOpen = false;
};

// A stored user token takes priority; a guest session is restored only without one.
const initialGuest = localStorage.getItem('token') ? null : readActiveGuestSession();

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        // true only for a real, signed-in user (never for a guest)
        isAuthenticated: false,
        isCheckingAuth: !!localStorage.getItem('token'),
        isLoading: false,
        error: null,
        // Guest mode (docs/GUEST_MODE_DESIGN.md)
        isGuest: !!initialGuest,
        guest: initialGuest, // { expiresAt } | null
        guestNoticeOpen: false, // the "You're in guest mode" notice shown when a session starts
        authModal: {
            isOpen: false,
            mode: 'login', // 'login' | 'signup' | 'guest-expired'
            redirectPath: null,
            notice: null // optional one-line explanation shown above the form
        }
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        openAuthModal: (state, action) => {
            state.authModal.isOpen = true;
            state.authModal.mode = action.payload?.mode || 'login';
            state.authModal.redirectPath = action.payload?.redirectPath || null;
            state.authModal.notice = action.payload?.notice || null;
            state.error = null;
        },
        closeAuthModal: (state) => {
            state.authModal.isOpen = false;
            state.authModal.mode = 'login';
            state.authModal.redirectPath = null;
            state.authModal.notice = null;
            state.error = null;
        },
        setAuthModalMode: (state, action) => {
            state.authModal.mode = action.payload;
            state.authModal.notice = null;
            state.error = null;
        },
        // Guest session ended without an API call: expired, revoked, or changed in another tab
        guestSessionEnded: (state) => {
            clearGuestState(state);
        },
        // Restores (or clears) guest mode from what is stored in this browser
        guestSessionRestored: (state, action) => {
            state.isGuest = !!action.payload;
            state.guest = action.payload || null;
            if (!action.payload) state.guestNoticeOpen = false;
        },
        dismissGuestNotice: (state) => {
            state.guestNoticeOpen = false;
        },
        // Local sign-out with no API call: used when the server says the session is gone (401),
        // after account deletion, and as the fallback when logout fails (BUG-07, BUG-08).
        sessionCleared: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isCheckingAuth = false;
            state.isLoading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // --- Register ---
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.authModal.isOpen = false;
                clearGuestState(state);
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Registration failed';
            })

            // --- Login ---
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true; 
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = !!action.payload;
                state.user = action.payload;
                state.authModal.isOpen = false;
                clearGuestState(state);
            })

            // --- Guest Mode ---
            .addCase(startGuestSession.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(startGuestSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isGuest = true;
                state.guest = action.payload;
                state.guestNoticeOpen = true;
                state.authModal.isOpen = false;
            })
            .addCase(startGuestSession.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Could not start a guest session.';
            })
            .addCase(endGuestSession.fulfilled, (state) => {
                clearGuestState(state);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Login failed';
                state.isAuthenticated = false;
                state.user = null;
            })

            // --- Check Auth (App Boot) ---
            .addCase(checkAuth.pending, (state) => {
                state.isCheckingAuth = true; 
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isCheckingAuth = false;
                state.isAuthenticated = !!action.payload;
                state.user = action.payload;
                if (action.payload) clearGuestState(state);
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isCheckingAuth = false;
                state.isAuthenticated = false;
                state.user = null;
            })

            // --- Logout ---
            .addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.isLoading = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(logoutUser.rejected, (state) => {
                // The token is already removed from localStorage; logout must always succeed locally.
                state.isLoading = false;
                state.user = null;
                state.isAuthenticated = false;
            })
    }
});

export const {
    clearError,
    openAuthModal,
    closeAuthModal,
    setAuthModalMode,
    sessionCleared,
    guestSessionEnded,
    guestSessionRestored,
    dismissGuestNotice
} = authSlice.actions;

// Another tab changed the stored session (login, logout, guest start or exit): re-read it here so
// this tab never shows one session while sending another tab's token.
export const syncAuthFromStorage = () => (dispatch) => {
    if (localStorage.getItem('token')) {
        dispatch(guestSessionEnded());
        dispatch(checkAuth());
        return;
    }
    dispatch(sessionCleared());
    dispatch(guestSessionRestored(readActiveGuestSession()));
};

export default authSlice.reducer;