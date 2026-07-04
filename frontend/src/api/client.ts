export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export type AgentResponse<TOutput> = {
  agent_name: string;
  status: 'success' | 'failed' | string;
  output: TOutput;
  errors?: string[];
};

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}