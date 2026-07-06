import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Building2, CheckCircle2, FilePlus2, GitCompare, Scale, ShieldAlert, Sparkles } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { runComparison, type ComparisonOutput } from '../api/comparison';
import { getWorkspaceAnalysis } from '../api/workspaces';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { AnalysisDocument } from '../types/analysis';

function severityClass(severity: string) {
  return `severity severity-${severity.toLowerCase()}`;
}

function defaultDocuments(documents: AnalysisDocument[]) {
  const companies = new Set<string>();
  return documents.filter((document) => {
    if (companies.has(document.company_name)) return false;
    companies.add(document.company_name);
    return true;
  }).map((document) => document._id);
}

export default function Comparison() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const analysis = useQuery({
    queryKey: ['comparison-documents', activeWorkspaceId],
    queryFn: () => getWorkspaceAnalysis(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
  });
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [result, setResult] = useState<ComparisonOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documents = useMemo(
    () => analysis.data?.documents.filter((document) => document.status === 'indexed') ?? [],
    [analysis.data?.documents],
  );

  useEffect(() => {
    setSelectedDocumentIds((current) => {
      const available = new Set(documents.map((document) => document._id));
      const retained = current.filter((id) => available.has(id));
      return retained.length ? retained : defaultDocuments(documents);
    });
  }, [documents]);

  const selectedDocuments = documents.filter((document) => selectedDocumentIds.includes(document._id));
  const selectedCompanies = Array.from(new Set(selectedDocuments.map((document) => document.company_name)));
  const ready = selectedCompanies.length >= 2;
  const companies = result?.coverage.companies ?? [];

  function toggleDocument(documentId: string) {
    setSelectedDocumentIds((current) => current.includes(documentId)
      ? current.filter((id) => id !== documentId)
      : [...current, documentId]);
    setResult(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!activeWorkspaceId || !ready) return;
    setBusy(true);
    setError(null);
    try {
      const response = await runComparison({ workspace_id: activeWorkspaceId, document_ids: selectedDocumentIds });
      setResult(response.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Company Comparison" subtitle="Select similar filings from two or more companies to benchmark only their shared, source-backed financial evidence." />
      <form className="comparison-setup" onSubmit={submit}>
        <div className="comparison-setup-heading"><div><p className="eyebrow">1. Choose reports</p><h2>Reports in this analysis</h2><p>Select one current filing per company for the cleanest peer benchmark.</p></div><span className={ready ? 'comparison-ready' : 'comparison-not-ready'}>{selectedCompanies.length} of 2 companies selected</span></div>
        {analysis.isLoading && <p className="muted">Loading available filings...</p>}
        {analysis.error && <p className="error-text">Could not load filings: {analysis.error.message}</p>}
        {documents.length > 0 && <div className="report-selector-grid">{documents.map((document) => { const checked = selectedDocumentIds.includes(document._id); return <label className={checked ? 'report-choice selected' : 'report-choice'} key={document._id}><input type="checkbox" checked={checked} onChange={() => toggleDocument(document._id)} /><Building2 size={19} aria-hidden="true" /><span><strong>{document.company_name}</strong><small>{document.file_name || document.document_type} · FY {document.fiscal_year || 'not stated'}</small></span>{checked && <CheckCircle2 size={18} aria-label="Included" />}</label>; })}</div>}
        {!analysis.isLoading && documents.length === 0 && <p className="muted">No indexed filings are available yet.</p>}
        {!ready && <div className="comparison-empty-state"><AlertCircle size={22} aria-hidden="true" /><div><strong>Another company filing is needed</strong><p>Upload a similar annual report or filing for a second company, then return here to select both reports.</p></div><Link to="/upload" className="primary-link"><FilePlus2 size={18} />Upload company filing</Link></div>}
        <div className="comparison-run-row"><span>{ready ? 'Only shared metrics for the selected companies will appear in the benchmark.' : 'Comparison is enabled after reports from two distinct companies are selected.'}</span><button type="submit" disabled={busy || !ready}><GitCompare size={18} />{busy ? 'Comparing' : 'Compare selected reports'}</button></div>
      </form>

      {error && <p className="error-text">{error}</p>}
      {result && !result.eligibility.ready && <section className="comparison-empty-state result-state"><AlertCircle size={22} aria-hidden="true" /><div><strong>Comparison needs more data</strong><p>{result.eligibility.message}</p></div><Link to="/upload" className="primary-link"><FilePlus2 size={18} />Upload company filing</Link></section>}
      {result?.eligibility.ready && <section className="comparison-workbench"><div className="comparison-summary-grid"><article><Scale size={20} /><span>Companies compared</span><strong>{result.coverage.company_count}</strong><small>{result.coverage.selected_document_count} selected filings</small></article><article><Sparkles size={20} /><span>Benchmark observations</span><strong>{result.benchmark_insights.length}</strong><small>{result.coverage.comparable_metric_rows} shared metric rows</small></article><article><ShieldAlert size={20} /><span>Risk signals</span><strong>{result.coverage.red_flags_considered}</strong><small>Across the selected companies</small></article></div><section className="comparison-insights"><div className="section-title-row"><div><p className="eyebrow">Peer view</p><h2>Benchmark observations</h2></div></div>{result.benchmark_insights.length === 0 ? <p className="muted">{result.eligibility.message}</p> : <div className="benchmark-grid">{result.benchmark_insights.map((insight) => <article key={`${insight.metric_key}-${insight.period}-${insight.leader}`}><span className="metric-tag">{insight.period || 'Reported period'}</span><h3>{insight.title}</h3><p>{insight.detail}</p><small>{insight.citations.map((citation) => `${citation.company_name} p. ${citation.page ?? 'n/a'}`).join(' · ')}</small></article>)}</div>}</section><section className="comparison-table-section"><div className="section-title-row"><div><p className="eyebrow">Shared metrics only</p><h2>Financial benchmark matrix</h2></div></div>{result.comparison.length === 0 ? <p className="muted">No shared metrics were extracted for the same fiscal period. Choose similar-period reports or upload a matching filing.</p> : <div className="table-scroll"><table className="analytics-table comparison-table"><thead><tr><th>Metric</th><th>Period</th>{companies.map((company) => <th key={company}>{company}</th>)}</tr></thead><tbody>{result.comparison.map((row) => <tr key={`${row.metric_key}-${row.period ?? 'na'}`}><td><strong>{row.metric_name}</strong><small className="normalization-note">{row.normalization_note}</small></td><td>{row.period ?? 'Not stated'}</td>{companies.map((company) => { const cell = row.companies[company]; return <td key={company}>{cell ? <div className="comparison-value"><strong>{cell.display_value}</strong><small>p. {cell.source_page ?? 'n/a'} · {Math.round(cell.confidence * 100)}%</small></div> : <span className="muted">Not reported</span>}</td>; })}</tr>)}</tbody></table></div>}</section><section className="risk-summary-section"><div className="section-title-row"><div><p className="eyebrow">Risk profile</p><h2>Company risk summary</h2></div></div>{result.risk_summary.length === 0 ? <p className="muted">No risk signals have been saved for the selected reports.</p> : <div className="risk-summary-grid">{result.risk_summary.map((risk) => <article key={risk.company_name}><div><h3>{risk.company_name}</h3><span className={severityClass(risk.highest_severity)}>{risk.highest_severity}</span></div><strong>{risk.risk_score}</strong><span className="risk-score-label">risk intensity score</span><p>{risk.critical_or_high} high-priority signal{risk.critical_or_high === 1 ? '' : 's'} · {risk.red_flag_count} total</p><small>{risk.examples.join(' · ') || 'No examples available'}</small></article>)}</div>}</section></section>}
    </>
  );
}
