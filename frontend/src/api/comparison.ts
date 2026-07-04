import { AgentResponse, apiFetch } from './client';

export type ComparisonRow = {
  metric_name: string;
  period?: string;
  companies: Record<string, number | null>;
  citations: Array<{ company_name: string; page?: number; evidence?: string }>;
};

export type RiskSummary = {
  company_name: string;
  red_flag_count: number;
  severities: string[];
  examples: string[];
};

export type ComparisonOutput = {
  comparison: ComparisonRow[];
  risk_summary: RiskSummary[];
};

export function runComparison(payload: { workspace_id: string }) {
  return apiFetch<AgentResponse<ComparisonOutput>>('/comparison/run', { method: 'POST', body: JSON.stringify(payload) });
}