/** Available roles in the system. Must match backend UserRole enum. */
export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent';

export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  permissions: string[];
  profileImageUrl?: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  /** True during login / OTP verify / refresh calls */
  isLoading: boolean;
  /** True during the initial app-load session hydration */
  isInitializing: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface OtpSendRequest {
  email: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}
