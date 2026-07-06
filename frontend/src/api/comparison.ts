import { AgentResponse, apiFetch } from './client';

export type ComparisonCell = {
  value: number | null;
  normalized_value: number | null;
  unit?: string | null;
  display_value: string;
  confidence: number;
  source_page?: number | null;
  document_id?: string;
  extraction_method?: string;
};

export type ComparisonRow = {
  metric_key: string;
  metric_name: string;
  period?: string;
  companies: Record<string, ComparisonCell>;
  citations: Array<{ company_name: string; page?: number; evidence?: string }>;
  normalization_note: string;
};

export type RiskSummary = {
  company_name: string;
  red_flag_count: number;
  risk_score: number;
  critical_or_high: number;
  highest_severity: string;
  severities: string[];
  examples: string[];
};

export type BenchmarkInsight = {
  metric_key: string;
  metric_name: string;
  period?: string;
  leader: string;
  trailing_company: string;
  direction: string;
  title: string;
  detail: string;
  citations: Array<{ company_name: string; page?: number | null; document_id?: string }>;
};

export type ComparisonEligibility = {
  ready: boolean;
  message: string;
  selected_document_ids: string[];
  selected_companies: string[];
  available_document_count: number;
  selected_document_count: number;
};

export type ComparisonOutput = {
  comparison: ComparisonRow[];
  benchmark_insights: BenchmarkInsight[];
  risk_summary: RiskSummary[];
  coverage: {
    company_count: number;
    companies: string[];
    selected_document_count: number;
    available_document_count: number;
    metric_rows: number;
    comparable_metric_rows: number;
    unmatched_metric_rows?: number;
    red_flags_considered: number;
  };
  eligibility: ComparisonEligibility;
};

export function runComparison(payload: { workspace_id: string; document_ids: string[] }) {
  return apiFetch<AgentResponse<ComparisonOutput>>('/comparison/run', { method: 'POST', body: JSON.stringify(payload) });
}
