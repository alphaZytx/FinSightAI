import { FormEvent, useState } from 'react';
import { GitCompare, Scale, ShieldAlert, Sparkles } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { runComparison, type ComparisonOutput } from '../api/comparison';
import { useWorkspaceStore } from '../store/workspaceStore';

function severityClass(severity: string) {
  return `severity severity-${severity.toLowerCase()}`;
}

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

  const companies = result?.coverage.companies ?? [];

  return (
    <>
      <PageHeader title="Peer Comparison" subtitle="Benchmark reported and derived financial evidence across the uploaded companies while keeping every value traceable to its source." />
      <form className="card comparison-run-form" onSubmit={submit}><div><p className="eyebrow">Comparison agent</p><h2>Benchmark current filings</h2><p className="muted">Upload at least two company documents to surface peer observations.</p></div><button type="submit" disabled={busy || !activeWorkspaceId}><GitCompare size={18} />{busy ? 'Comparing' : 'Run comparison'}</button></form>
      {!activeWorkspaceId && <p className="muted">Preparing analysis...</p>}
      {error && <p className="error-text">{error}</p>}
      {result && <section className="comparison-workbench"><div className="comparison-summary-grid"><article><Scale size={20} /><span>Companies in scope</span><strong>{result.coverage.company_count}</strong><small>{result.coverage.comparable_metric_rows} comparable metric rows</small></article><article><Sparkles size={20} /><span>Benchmark observations</span><strong>{result.benchmark_insights.length}</strong><small>Evidence-backed peer differences</small></article><article><ShieldAlert size={20} /><span>Risk signals</span><strong>{result.coverage.red_flags_considered}</strong><small>Across selected companies</small></article></div><section className="comparison-insights"><div className="section-title-row"><div><p className="eyebrow">Peer view</p><h2>Benchmark observations</h2></div></div>{result.benchmark_insights.length === 0 ? <p className="muted">Comparable observations will appear after at least two companies have extracted metrics for the same period.</p> : <div className="benchmark-grid">{result.benchmark_insights.map((insight) => <article key={`${insight.metric_key}-${insight.period}-${insight.leader}`}><span className="metric-tag">{insight.period || 'Reported period'}</span><h3>{insight.title}</h3><p>{insight.detail}</p><small>{insight.citations.map((citation) => `${citation.company_name} p. ${citation.page ?? 'n/a'}`).join(' · ')}</small></article>)}</div>}</section><section className="comparison-table-section"><div className="section-title-row"><div><p className="eyebrow">Comparable metrics</p><h2>Financial benchmark matrix</h2></div></div>{result.comparison.length === 0 ? <p className="muted">No extracted metrics found in the current analysis.</p> : <div className="table-scroll"><table className="analytics-table comparison-table"><thead><tr><th>Metric</th><th>Period</th>{companies.map((company) => <th key={company}>{company}</th>)}</tr></thead><tbody>{result.comparison.map((row) => <tr key={`${row.metric_key}-${row.period ?? 'na'}`}><td><strong>{row.metric_name}</strong><small className="normalization-note">{row.normalization_note}</small></td><td>{row.period ?? 'Not stated'}</td>{companies.map((company) => { const cell = row.companies[company]; return <td key={company}>{cell ? <div className="comparison-value"><strong>{cell.display_value}</strong><small>p. {cell.source_page ?? 'n/a'} · {Math.round(cell.confidence * 100)}%</small></div> : <span className="muted">Not reported</span>}</td>; })}</tr>)}</tbody></table></div>}</section><section className="risk-summary-section"><div className="section-title-row"><div><p className="eyebrow">Risk profile</p><h2>Company risk summary</h2></div></div>{result.risk_summary.length === 0 ? <p className="muted">No risk signals have been saved yet.</p> : <div className="risk-summary-grid">{result.risk_summary.map((risk) => <article key={risk.company_name}><div><h3>{risk.company_name}</h3><span className={severityClass(risk.highest_severity)}>{risk.highest_severity}</span></div><strong>{risk.risk_score}</strong><span className="risk-score-label">risk intensity score</span><p>{risk.critical_or_high} high-priority signal{risk.critical_or_high === 1 ? '' : 's'} · {risk.red_flag_count} total</p><small>{risk.examples.join(' · ') || 'No examples available'}</small></article>)}</div>}</section></section>}
    </>
  );
}
