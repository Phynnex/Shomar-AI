import { post } from '@/lib/api/http';

export type RegisterRequest = {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  terms_accepted: boolean;
  marketing_consent: boolean;
};

export type RegisterResponse = {
  message?: string;
  [key: string]: unknown;
};

export async function register(body: RegisterRequest) {
  return post<RegisterResponse, RegisterRequest>('/api/auth/register', body);
}

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token?: string;
  accessToken?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
  user_info?: Record<string, unknown>;
  [key: string]: unknown;
};

export async function login(body: LoginRequest) {
  return post<LoginResponse, LoginRequest>('/api/auth/login', body);
}

