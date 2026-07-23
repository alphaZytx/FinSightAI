import { API_BASE_URL } from './client';
import type { AuthUser } from '../../utils/auth';

// --------------------------------------------------------------------------- #
// Shared types                                                                 #
// --------------------------------------------------------------------------- #

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface ApiError {
  detail: string;
}

// --------------------------------------------------------------------------- #
// Raw fetch helper (no auth header — used only for auth endpoints)            #
// --------------------------------------------------------------------------- #

async function authFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const err: ApiError = await response.json();
      if (err.detail) detail = err.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

// --------------------------------------------------------------------------- #
// Auth API calls                                                               #
// --------------------------------------------------------------------------- #

export async function apiRegister(
  email: string,
  fullName: string,
  password: string,
): Promise<TokenResponse> {
  return authFetch<TokenResponse>('/auth/register', {
    email,
    full_name: fullName,
    password,
  });
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  return authFetch<TokenResponse>('/auth/login', { email, password });
}

export async function apiGetMe(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json() as Promise<AuthUser>;
}

export async function apiGoogleLogin(token: string): Promise<TokenResponse> {
  return authFetch<TokenResponse>('/auth/google', { token });
}

export async function apiForgotPassword(email: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>('/auth/forgot-password', { email });
}

export async function apiResetPassword(token: string, new_password: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>('/auth/reset-password', { token, new_password });
}
