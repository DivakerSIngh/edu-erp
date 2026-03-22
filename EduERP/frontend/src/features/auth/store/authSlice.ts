import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../services/authService';
import type {
  AuthState,
  LoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  UserProfile,
} from '../types/auth.types';

// ── Initial State ────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user:             null,
  isAuthenticated:  false,
  isLoading:        false,
  isInitializing:   true,   // True until first session-check completes
  error:            null,
};

// ── Async Thunks ─────────────────────────────────────────────────────────────

/** Email + password login */
export const loginWithCredentials = createAsyncThunk<UserProfile, LoginRequest>(
  'auth/loginWithCredentials',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.loginWithCredentials(credentials);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      return rejectWithValue(msg);
    }
  }
);

/** Step 1 of OTP flow — sends OTP to email */
export const sendOtp = createAsyncThunk<void, OtpSendRequest>(
  'auth/sendOtp',
  async (request, { rejectWithValue }) => {
    try {
      await authService.sendOtp(request);
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

/** Step 2 of OTP flow — verifies OTP and issues tokens */
export const verifyOtp = createAsyncThunk<UserProfile, OtpVerifyRequest>(
  'auth/verifyOtp',
  async (request, { rejectWithValue }) => {
    try {
      return await authService.verifyOtp(request);
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

/** Logout — revokes tokens server-side, clears cookies */
export const logout = createAsyncThunk<void, void>(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

/**
 * Session hydration on app load.
 * Calls /auth/me — if the HttpOnly access_token cookie is valid, returns profile.
 * If not, silently treats user as unauthenticated.
 */
export const initializeSession = createAsyncThunk<UserProfile | null, void>(
  'auth/initializeSession',
  async () => {
    try {
      return await authService.getProfile();
    } catch {
      return null;
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    /** Called by Axios interceptor when refresh fails — immediate logout */
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    // ── loginWithCredentials ────────────────────────────────────────────────
    builder
      .addCase(loginWithCredentials.pending,   setLoading)
      .addCase(loginWithCredentials.fulfilled, setAuthenticated)
      .addCase(loginWithCredentials.rejected,  setError);

    // ── OTP flow ────────────────────────────────────────────────────────────
    builder
      .addCase(sendOtp.pending,   setLoading)
      .addCase(sendOtp.fulfilled, (state) => { state.isLoading = false; })
      .addCase(sendOtp.rejected,  setError)

      .addCase(verifyOtp.pending,   setLoading)
      .addCase(verifyOtp.fulfilled, setAuthenticated)
      .addCase(verifyOtp.rejected,  setError);

    // ── logout ──────────────────────────────────────────────────────────────
    builder
      .addCase(logout.fulfilled, () => ({ ...initialState, isInitializing: false }));

    // ── session init ────────────────────────────────────────────────────────
    builder
      .addCase(initializeSession.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(initializeSession.fulfilled, (state, action) => {
        state.isInitializing  = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user            = action.payload;
        }
      })
      .addCase(initializeSession.rejected, (state) => {
        state.isInitializing = false;
      });
  },
});

// ── Reducers (reused across cases) ──────────────────────────────────────────

function setLoading(state: AuthState) {
  state.isLoading = true;
  state.error     = null;
}

function setAuthenticated(state: AuthState, action: PayloadAction<UserProfile>) {
  state.isLoading       = false;
  state.isAuthenticated = true;
  state.user            = action.payload;
}

function setError(state: AuthState, action: PayloadAction<unknown>) {
  state.isLoading = false;
  state.error     = (action.payload as string) ?? 'An unexpected error occurred.';
}

function extractErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    (err as { response?: { data?: { message?: string } } }).response?.data?.message
  ) {
    return (err as { response: { data: { message: string } } }).response.data.message;
  }
  return 'An unexpected error occurred.';
}

// ── Exports ──────────────────────────────────────────────────────────────────

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
