export { request, requestWithAuth } from './client';
export type { ApiError } from './client';
export { sendSignupOtp, sendLoginOtp, signup, login, logout } from './auth';
export type {
  User,
  LoginResponse,
  SignupResponse,
  SendOtpResponse,
} from './auth';
