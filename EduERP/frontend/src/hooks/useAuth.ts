import { useAppDispatch, useAppSelector } from '../app/store';
import {
  loginWithCredentials,
  sendOtp,
  verifyOtp,
  logout,
  clearError,
} from '../features/auth/store/authSlice';
import type {
  LoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  UserRole,
} from '../features/auth/types/auth.types';

/**
 * Central auth hook.
 *
 * Provides:
 *  - Auth state (user, isAuthenticated, isLoading, error)
 *  - Actions (login, sendOtp, verifyOtp, logout)
 *  - Permission helpers (hasRole, hasPermission)
 *  - Session initialization on mount
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const auth     = useAppSelector((s) => s.auth);

  /** Email + password login */
  const login = (data: LoginRequest) =>
    dispatch(loginWithCredentials(data)).unwrap();

  /** Send OTP to email */
  const requestOtp = (data: OtpSendRequest) =>
    dispatch(sendOtp(data)).unwrap();

  /** Verify OTP and complete login */
  const confirmOtp = (data: OtpVerifyRequest) =>
    dispatch(verifyOtp(data)).unwrap();

  /** Logout — clears server-side tokens + cookies */
  const signOut = () => dispatch(logout()).unwrap();

  /** Check if user holds any of the given roles */
  const hasRole = (...roles: UserRole[]): boolean =>
    !!auth.user && roles.includes(auth.user.role);

  /** Check if user has a specific permission string */
  const hasPermission = (permission: string): boolean =>
    auth.user?.permissions?.includes(permission) ?? false;

  return {
    user:            auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading:       auth.isLoading,
    isInitializing:  auth.isInitializing,
    error:           auth.error,
    login,
    requestOtp,
    confirmOtp,
    signOut,
    hasRole,
    hasPermission,
    clearError: () => dispatch(clearError()),
  };
}
