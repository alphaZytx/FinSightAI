import { AgentResponse, apiFetch } from './client';

export type ReportOutput = {
  report_path: string;
  sections?: Array<{ heading: string; content: string }>;
};

export function generateReport(payload: { workspace_id: string; title: string; sections?: Array<{ heading: string; content: string }> }) {
  return apiFetch<AgentResponse<ReportOutput>>('/reports/generate', { method: 'POST', body: JSON.stringify(payload) });
}