import { API_BASE_URL } from './client';
import type { AnalysisMetric, AnalysisRedFlag } from '../types/analysis';

export type AgentStep<TOutput = Record<string, unknown>> = {
  agent_name: string;
  status: string;
  output: TOutput;
  errors?: string[];
};

export type IngestionResults = {
  document?: AgentStep<{ workspace_id?: string; pages_processed?: number; chunks_created?: number }>;
  extraction?: AgentStep<{ metrics?: AnalysisMetric[]; metrics_saved?: number; derived_ratio_count?: number; coverage?: Record<string, number> }>;
  red_flags?: AgentStep<{ red_flags?: AnalysisRedFlag[]; red_flags_saved?: number; severity_counts?: Record<string, number> }>;
  comparison?: AgentStep<{ coverage?: { company_count?: number; comparable_metric_rows?: number } }>;
};

export type IngestResponse = {
  document_id: string;
  results: IngestionResults;
};

export type DocumentUploadResponse = {
  _id: string;
  workspace_id: string;
  company_name: string;
  fiscal_year: string;
  document_type: string;
  file_name: string;
  status: string;
  ingestion_result?: IngestResponse;
};

export async function uploadDocument(formData: FormData): Promise<DocumentUploadResponse> {
  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || 'Upload failed');
  }
  return response.json() as Promise<DocumentUploadResponse>;
}

export async function ingestDocument(documentId: string): Promise<IngestResponse> {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/ingest`, { method: 'POST' });
  if (!response.ok) throw new Error('Ingestion failed');
  return response.json() as Promise<IngestResponse>;
}
