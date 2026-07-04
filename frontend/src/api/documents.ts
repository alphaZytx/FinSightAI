import { API_BASE_URL } from './client';

export type IngestResponse = {
  document_id: string;
  results: Record<string, unknown>;
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