import { FormEvent, useState } from 'react';
import { FileText } from 'lucide-react';
import { generateReport, type ReportOutput } from '../../api/reports';
import { useWorkspaceStore } from '../../store/workspaceStore';
import WorkspaceSelector from '../workspaces/WorkspaceSelector';

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
    <section className="report-layout">
      <form className="card form-card" onSubmit={submit}>
        <WorkspaceSelector />
        <label>
          Report title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <button type="submit" disabled={busy || !activeWorkspaceId}>
          <FileText size={18} />
          {busy ? 'Generating' : 'Generate PDF'}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>

      <section className="card answer-card">
        {result ? (
          <>
            <h2>Generated report</h2>
            <p className="file-path">{result.report_path}</p>
            {result.sections?.map((section) => (
              <article className="report-section" key={section.heading}>
                <h3>{section.heading}</h3>
                <p>{section.content}</p>
              </article>
            ))}
          </>
        ) : (
          <p className="muted">Generate a PDF after extraction has run for a workspace.</p>
        )}
      </section>
    </section>
  );
}