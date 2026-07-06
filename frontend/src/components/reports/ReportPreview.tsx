import { FormEvent, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { API_ROOT_URL } from '../../api/client';
import { generateReport, type ReportOutput } from '../../api/reports';
import { useWorkspaceStore } from '../../store/workspaceStore';

export default function ReportPreview() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [title, setTitle] = useState('FinSightAI Analyst Report');
  const [result, setResult] = useState<ReportOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!activeWorkspaceId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await generateReport({ workspace_id: activeWorkspaceId, title: title.trim() || 'FinSightAI Analyst Report' });
      setResult(response.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="report-layout"><form className="card form-card report-form" onSubmit={submit}><div><p className="eyebrow">Report agent</p><h2>Build analyst report</h2><p className="muted">The PDF brings together extracted metrics, risk signals, peer observations, and source citations.</p></div><label>Report title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><button type="submit" disabled={busy || !activeWorkspaceId}><FileText size={18} />{busy ? 'Compiling report' : 'Generate PDF report'}</button>{!activeWorkspaceId && <p className="muted">Preparing analysis...</p>}{error && <p className="error-text">{error}</p>}</form><section className="report-preview-area">{result ? <><div className="report-result-header"><div><p className="eyebrow">Report ready</p><h2>Analyst report preview</h2></div>{result.report_url && <a className="download-link" href={`${API_ROOT_URL}${result.report_url}`} target="_blank" rel="noreferrer"><Download size={18} />Open PDF</a>}</div>{result.coverage && <div className="report-coverage"><span>{result.coverage.documents ?? 0} documents</span><span>{result.coverage.metrics ?? 0} metrics</span><span>{result.coverage.red_flags ?? 0} risk signals</span></div>}<div className="report-sections">{result.sections?.map((section) => <article className="report-section" key={section.heading}><h3>{section.heading}</h3><p>{section.content}</p></article>)}</div></> : <div className="report-empty"><FileText size={26} aria-hidden="true" /><h2>Research-ready reporting</h2><p>Generate a PDF after filings have been indexed and analyzed.</p></div>}</section></section>
  );
}
