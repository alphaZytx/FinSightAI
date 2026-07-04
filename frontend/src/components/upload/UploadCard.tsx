import { FormEvent, useState } from 'react';
import { FileUp, Play } from 'lucide-react';
import { ingestDocument, uploadDocument, type DocumentUploadResponse, type IngestResponse } from '../../api/documents';
import { useWorkspaceStore } from '../../store/workspaceStore';
import WorkspaceSelector from '../workspaces/WorkspaceSelector';

export default function UploadCard() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [companyName, setCompanyName] = useState('');
  const [fiscalYear, setFiscalYear] = useState('2025');
  const [documentType, setDocumentType] = useState('annual_report');
  const [autoIngest, setAutoIngest] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<DocumentUploadResponse | null>(null);
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !activeWorkspaceId) return;
    setBusy(true);
    setError(null);
    setIngestResult(null);
    try {
      const formData = new FormData();
      formData.append('workspace_id', activeWorkspaceId);
      formData.append('company_name', companyName);
      formData.append('fiscal_year', fiscalYear);
      formData.append('document_type', documentType);
      formData.append('auto_ingest', String(autoIngest));
      formData.append('file', file);
      const response = await uploadDocument(formData);
      setUploaded(response);
      if (response.ingestion_result) setIngestResult(response.ingestion_result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function runIngestion() {
    if (!uploaded) return;
    setBusy(true);
    setError(null);
    try {
      setIngestResult(await ingestDocument(uploaded._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card form-card">
      <form onSubmit={submit}>
        <WorkspaceSelector />
        <label>
          Company name
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required placeholder="Company Ltd" />
        </label>
        <div className="two-column">
          <label>
            Fiscal year
            <input value={fiscalYear} onChange={(event) => setFiscalYear(event.target.value)} required />
          </label>
          <label>
            Document type
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
              <option value="annual_report">Annual report</option>
              <option value="10_k">10-K</option>
              <option value="10_q">10-Q</option>
              <option value="transcript">Transcript</option>
            </select>
          </label>
        </div>
        <label>
          PDF file
          <input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={autoIngest} onChange={(event) => setAutoIngest(event.target.checked)} />
          Run extraction and red-flag agents after upload
        </label>
        <button type="submit" disabled={busy || !file || !activeWorkspaceId}>
          <FileUp size={18} />
          {busy ? 'Working' : autoIngest ? 'Upload and ingest' : 'Upload'}
        </button>
      </form>

      {uploaded && (
        <div className="result-panel">
          <div>
            <strong>{uploaded.file_name}</strong>
            <span>{uploaded._id} - {uploaded.status}</span>
          </div>
          {!ingestResult && (
            <button type="button" onClick={runIngestion} disabled={busy}>
              <Play size={18} />
              Ingest and run agents
            </button>
          )}
        </div>
      )}
      {ingestResult && <pre className="json-panel">{JSON.stringify(ingestResult.results, null, 2)}</pre>}
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}