import { apiFetch } from './client';
import type { WorkspaceAnalysis } from '../../types';

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

export function getDefaultWorkspace(): Promise<WorkspaceRecord> {
  return apiFetch<WorkspaceRecord>('/workspaces/default', { method: 'POST' });
}

export function getWorkspaceAnalysis(workspaceId: string): Promise<WorkspaceAnalysis> {
  return apiFetch<WorkspaceAnalysis>(`/workspaces/${workspaceId}/analysis`);
}

export type ClearWorkspaceDataResponse = {
  cleared: boolean;
  workspace_id: string;
  documents_deleted: number;
  chunks_deleted: number;
  metrics_deleted: number;
  flags_deleted: number;
};

export function clearWorkspaceData(workspaceId: string): Promise<ClearWorkspaceDataResponse> {
  return apiFetch<ClearWorkspaceDataResponse>(`/workspaces/${workspaceId}/data`, { method: 'DELETE' });
}
