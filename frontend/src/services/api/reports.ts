import { type AgentResponse, apiFetch } from './client';

export type ReportOutput = {
  report_path: string;
  report_url?: string;
  sections?: Array<{ heading: string; content: string }>;
  coverage?: { companies?: string[]; documents?: number; metrics?: number; red_flags?: number };
};

export function generateReport(payload: { workspace_id: string; title: string; company_names?: string[]; sections?: Array<{ heading: string; content: string }> }) {
  return apiFetch<AgentResponse<ReportOutput>>('/reports/generate', { method: 'POST', body: JSON.stringify(payload) });
}
