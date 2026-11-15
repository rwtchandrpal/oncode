import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../../utils/axiosClient';

// Helper to handle axios errors consistently
export const handleAxiosError = (error, rejectWithValue) => {
    if (error.response) {
        const backendMessage = error.response.data?.message || 'Server rejected the request.';
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
            }
            return response.data.user;
        } catch(error) {
            return handleAxiosError(error, rejectWithValue);
        }
    }
);

export const loginDemoUser = createAsyncThunk(
    'auth/demo',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post('/user/demo');
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return response.data.user;
        } catch (error) {
            return handleAxiosError(error, rejectWithValue);
        }
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

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isAuthenticated: false,
        isCheckingAuth: !!localStorage.getItem('token'), 
        isLoading: false,     
        error: null,
        authModal: {
            isOpen: false,
            mode: 'login', // 'login' | 'signup' | 'demo'
            redirectPath: null
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
            state.error = null;
        },
        closeAuthModal: (state) => {
            state.authModal.isOpen = false;
            state.authModal.mode = 'login';
            state.authModal.redirectPath = null;
            state.error = null;
        },
        setAuthModalMode: (state, action) => {
            state.authModal.mode = action.payload;
            state.error = null;
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
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Login failed';
                state.isAuthenticated = false;
                state.user = null;
            })

            // --- Demo Login ---
            .addCase(loginDemoUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginDemoUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = !!action.payload;
                state.user = action.payload;
                state.authModal.isOpen = false;
            })
            .addCase(loginDemoUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Demo session creation failed';
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
            .addCase(logoutUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Logout failed';
            })
    }
});

export const { clearError, openAuthModal, closeAuthModal, setAuthModalMode } = authSlice.actions;
export default authSlice.reducer;