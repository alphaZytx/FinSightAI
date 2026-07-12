export { API_BASE_URL, API_ROOT_URL, apiFetch } from './client';
export type { AgentResponse } from './client';

export { uploadDocument, ingestDocument } from './documents';
export type { DocumentUploadResponse, IngestResponse, IngestionResults, AgentStep } from './documents';

export { listWorkspaces, createWorkspace, getDefaultWorkspace, getWorkspaceAnalysis } from './workspaces';
export type { WorkspaceRecord } from './workspaces';

export { askResearchQuestion } from './research';
export type { Citation, ResearchOutput } from './research';

export { runComparison } from './comparison';
export type { ComparisonOutput, ComparisonRow, ComparisonCell, ComparisonEligibility, BenchmarkInsight, RiskSummary } from './comparison';

export { generateReport } from './reports';
export type { ReportOutput } from './reports';

export { getHealth } from './health';
export type { HealthResponse } from './health';
