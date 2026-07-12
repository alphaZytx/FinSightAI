export type AgentStatus = 'Ready' | 'Processing' | 'Idle' | 'Error';

export interface Agent {
  name: string;
  status: AgentStatus;
}

export interface StatCard {
  label: string;
  value: number;
  change?: string;
  icon: string;
}

export interface QuickAction {
  label: string;
  icon: string;
  path: string;
  variant?: 'primary' | 'secondary';
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'analysis' | 'report' | 'chat';
  title: string;
  description: string;
  timestamp: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  uploadDate: string;
  analysisStatus: 'Complete' | 'In Progress' | 'Pending' | 'Failed';
}

export interface ResearchStep {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface ChartDataPoint {
  period: string;
  value: number;
}

export interface FinancialRatio {
  name: string;
  value: number;
  benchmark: number;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

// ── Backend analysis types ──────────────────────────────────────

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
