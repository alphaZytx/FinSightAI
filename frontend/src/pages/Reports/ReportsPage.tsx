import { type FormEvent, useState } from 'react';
import { FileOutput, Download, FileText } from 'lucide-react';
import { Card } from '../../components/Common';
import { generateReport, type ReportOutput } from '../../services/api/reports';
import { API_ROOT_URL } from '../../services/api/client';
import { useWorkspaceStore } from '../../store/workspaceStore';

export default function ReportsPage() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate analyst-style PDF research reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Generate Form */}
        <Card title="Generate Report" subtitle="The PDF brings together metrics, risk signals, peer observations, and citations">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Report Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={busy || !activeWorkspaceId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary hover:bg-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileOutput className="h-4 w-4" />
              {busy ? 'Compiling report…' : 'Generate PDF Report'}
            </button>

            {!activeWorkspaceId && <p className="text-xs text-muted-foreground text-center">Preparing workspace…</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </Card>

        {/* Report Preview */}
        <Card title={result ? 'Report Preview' : 'Report Output'}>
          {result ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Report ready</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">Analyst Report</h3>
                </div>
                {result.report_url && (
                  <a
                    href={`${API_ROOT_URL}${result.report_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Open PDF
                  </a>
                )}
              </div>

              {/* Coverage Stats */}
              {result.coverage && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-lg font-bold text-white">{result.coverage.documents ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-lg font-bold text-white">{result.coverage.metrics ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Metrics</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-lg font-bold text-white">{result.coverage.red_flags ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Risk Signals</p>
                  </div>
                </div>
              )}

              {/* Sections Preview */}
              {result.sections && result.sections.length > 0 && (
                <div className="space-y-3">
                  {result.sections.map((section) => (
                    <div key={section.heading} className="rounded-lg border border-border bg-card p-4">
                      <h4 className="text-sm font-semibold text-foreground">{section.heading}</h4>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-4">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600/15">
                <FileText className="h-7 w-7 text-primary-400" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground-muted">Research-ready Reporting</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Generate a PDF after filings have been indexed and analyzed. The report includes metrics, risk signals, and source citations.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
