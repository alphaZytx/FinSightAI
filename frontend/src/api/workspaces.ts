import { apiFetch } from './client';

export type WorkspaceRecord = {
  _id: string;
  name: string;
  description?: string;
  created_at?: string;
};

export function listWorkspaces(): Promise<WorkspaceRecord[]> {
  return apiFetch<WorkspaceRecord[]>('/workspaces');
}

export function createWorkspace(payload: { name: string; description?: string }): Promise<WorkspaceRecord> {
  return apiFetch<WorkspaceRecord>('/workspaces', { method: 'POST', body: JSON.stringify(payload) });
}