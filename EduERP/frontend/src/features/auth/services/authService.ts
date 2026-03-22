import apiClient from '../../../services/api/axiosInstance';
import type {
  LoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  UserProfile,
} from '../types/auth.types';

const authService = {
  /**
   * Email + password login.
   * Tokens are set as HttpOnly cookies by the server — nothing to store client-side.
   */
  async loginWithCredentials(data: LoginRequest): Promise<UserProfile> {
    const res = await apiClient.post<{ data: UserProfile }>('/auth/login', data);
    return res.data.data;
  },

  /** Send OTP to user's registered email. */
  async sendOtp(data: OtpSendRequest): Promise<void> {
    await apiClient.post('/auth/otp/send', data);
  },

  /** Verify OTP and receive tokens as HttpOnly cookies. */
  async verifyOtp(data: OtpVerifyRequest): Promise<UserProfile> {
    const res = await apiClient.post<{ data: UserProfile }>('/auth/otp/verify', data);
    return res.data.data;
  },

  /** Revoke tokens server-side and clear cookies. */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  /** Fetch the authenticated user's profile. Used to hydrate state on page load. */
  async getProfile(): Promise<UserProfile> {
    const res = await apiClient.get<{ data: UserProfile }>('/auth/me');
    return res.data.data;
  },
};

export default authService;
