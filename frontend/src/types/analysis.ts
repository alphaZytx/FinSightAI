export type AnalysisDocument = {
  _id: string;
  company_name: string;
  fiscal_year?: string;
  document_type?: string;
  file_name?: string;
  status: string;
};

export type AnalysisMetric = {
  _id: string;
  company_name: string;
  metric_name: string;
  display_name?: string;
  value: number | null;
  normalized_value?: number | null;
  unit?: string | null;
  period?: string | null;
  source_page?: number | null;
  document_id?: string;
  evidence?: string;
  confidence?: number;
  extraction_method?: string;
};

export type AnalysisRedFlag = {
  _id: string;
  company_name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  title: string;
  explanation: string;
  source_page?: number | null;
  document_id?: string;
  evidence?: string;
  confidence?: number;
  detection_method?: string;
};

export type WorkspaceAnalysis = {
  workspace_id: string;
  summary: {
    document_count: number;
    indexed_document_count: number;
    company_count: number;
    companies: string[];
    metric_count: number;
    red_flag_count: number;
    high_priority_flag_count: number;
    severity_counts: Record<string, number>;
    pipeline_ready: boolean;
  };
  documents: AnalysisDocument[];
  metrics: AnalysisMetric[];
  red_flags: AnalysisRedFlag[];
};
