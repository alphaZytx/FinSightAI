import { AgentResponse, apiFetch } from './client';

export type Citation = {
  document_id: string;
  page?: number;
  chunk_id: string;
  snippet: string;
};

export type ResearchOutput = {
  answer: string;
  citations: Citation[];
};

export function askResearchQuestion(payload: { workspace_id: string; question: string; session_id?: string }) {
  return apiFetch<AgentResponse<ResearchOutput>>('/research/chat', { method: 'POST', body: JSON.stringify(payload) });
}