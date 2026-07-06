import { AgentResponse, apiFetch } from './client';

export type Citation = {
  citation_id?: string;
  document_id: string;
  page?: number;
  chunk_id: string;
  snippet: string;
  score?: number;
};

export type ResearchOutput = {
  answer: string;
  citations: Citation[];
  research_steps?: { question_breakdown: string[]; evidence_count: number; citation_policy: string };
};

export function askResearchQuestion(payload: { workspace_id: string; question: string; session_id?: string }) {
  return apiFetch<AgentResponse<ResearchOutput>>('/research/chat', { method: 'POST', body: JSON.stringify(payload) });
}
