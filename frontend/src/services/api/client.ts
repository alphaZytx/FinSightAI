import { getToken, clearSession } from '../../utils/auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export type AgentResponse<TOutput> = {
  agent_name: string;
  status: 'success' | 'failed' | string;
  output: TOutput;
  errors?: string[];
};

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Token expired or revoked — clear local session and redirect to login
  if (response.status === 401) {
    clearSession();
    window.location.href = '/login';
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    let detail = `API error: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}
