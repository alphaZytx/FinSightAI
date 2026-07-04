import { FormEvent, useState } from 'react';
import { GitCompare } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import WorkspaceSelector from '../components/workspaces/WorkspaceSelector';
import { runComparison, type ComparisonOutput } from '../api/comparison';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Comparison() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [result, setResult] = useState<ComparisonOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!activeWorkspaceId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await runComparison({ workspace_id: activeWorkspaceId });
      setResult(response.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setBusy(false);
    }
  }

  const companies = Array.from(new Set(result?.comparison.flatMap((row) => Object.keys(row.companies)) ?? []));

  return (
    <>
      <PageHeader title="Company Comparison" subtitle="Benchmark companies across extracted metrics and risk indicators." />
      <form className="card compact-form" onSubmit={submit}>
        <WorkspaceSelector />
        <button type="submit" disabled={busy || !activeWorkspaceId}>
          <GitCompare size={18} />
          {busy ? 'Comparing' : 'Run comparison'}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
      {result && (
        <section className="card table-card">
          <h2>Metrics</h2>
          {result.comparison.length === 0 ? <p className="muted">No extracted metrics found.</p> : (
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Period</th>
                  {companies.map((company) => <th key={company}>{company}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.comparison.map((row) => (
                  <tr key={`${row.metric_name}-${row.period ?? 'na'}`}>
                    <td>{row.metric_name}</td>
                    <td>{row.period ?? '-'}</td>
                    {companies.map((company) => <td key={company}>{row.companies[company] ?? '-'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h2>Risk summary</h2>
          <div className="stack">
            {result.risk_summary.map((risk) => (
              <article className="workspace-row" key={risk.company_name}>
                <strong>{risk.company_name}</strong>
                <span>{risk.red_flag_count} red flags - {risk.severities.join(', ') || 'no severity'}</span>
                <p>{risk.examples.join(', ')}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}