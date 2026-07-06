import { FormEvent, useState } from 'react';
import { FileUp, Play } from 'lucide-react';
import { ingestDocument, uploadDocument, type DocumentUploadResponse, type IngestResponse } from '../../api/documents';
import PipelineResults from '../analysis/PipelineResults';
import { useWorkspaceStore } from '../../store/workspaceStore';

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
      formData.append('company_name', companyName.trim());
      formData.append('fiscal_year', fiscalYear.trim());
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
    <section className="upload-layout">
      <form className="card form-card upload-form" onSubmit={submit}>
        <div><p className="eyebrow">Document analysis</p><h2>Ingest a financial filing</h2><p className="muted">PDF files are parsed, indexed, extracted, risk-scanned, and added to peer analysis automatically.</p></div>
        <label>Company name<input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required placeholder="Company Ltd" /></label>
        <div className="two-column"><label>Fiscal year<input value={fiscalYear} onChange={(event) => setFiscalYear(event.target.value)} required /></label><label>Document type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="annual_report">Annual report</option><option value="10_k">10-K</option><option value="10_q">10-Q</option><option value="transcript">Transcript</option></select></label></div>
        <label>PDF file<input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></label>
        {file && <p className="selected-file">Selected: {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
        <label className="checkbox-row"><input type="checkbox" checked={autoIngest} onChange={(event) => setAutoIngest(event.target.checked)} />Run extraction, risk scan, and comparison after upload</label>
        <button type="submit" disabled={busy || !file || !activeWorkspaceId}><FileUp size={18} />{busy ? 'Processing' : autoIngest ? 'Upload and analyze' : 'Upload document'}</button>
        {!activeWorkspaceId && <p className="muted">Preparing analysis...</p>}
        {error && <p className="error-text">{error}</p>}
      </form>
      <section className="upload-result-area">{uploaded && !ingestResult && <section className="upload-pending"><div><strong>{uploaded.file_name}</strong><span>{uploaded.company_name} · FY {uploaded.fiscal_year} · {uploaded.status}</span></div><button type="button" onClick={runIngestion} disabled={busy}><Play size={18} />Run analysis</button></section>}{ingestResult ? <PipelineResults result={ingestResult} /> : !uploaded && <section className="upload-placeholder"><FileUp size={26} aria-hidden="true" /><h2>Analysis will appear here</h2><p>After ingestion, review processing status, extracted financial evidence, risk signals, and peer comparison coverage in one place.</p></section>}</section>
    </section>
  );
}
