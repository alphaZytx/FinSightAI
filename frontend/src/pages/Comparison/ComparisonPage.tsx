import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitCompare, Building2, CheckCircle2, AlertCircle, FilePlus2, Scale, Sparkles, ShieldAlert } from 'lucide-react';
import { Card, Badge } from '../../components/Common';
import { runComparison, type ComparisonOutput } from '../../services/api/comparison';
import { getWorkspaceAnalysis } from '../../services/api/workspaces';
import { useWorkspaceStore } from '../../store/workspaceStore';
import type { AnalysisDocument } from '../../types';

function defaultDocuments(documents: AnalysisDocument[]) {
  const companies = new Set<string>();
  return documents.filter((doc) => {
    if (companies.has(doc.company_name)) return false;
    companies.add(doc.company_name);
    return true;
  }).map((doc) => doc._id);
}

export default function ComparisonPage() {
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
    () => analysis.data?.documents.filter((doc) => doc.status === 'indexed') ?? [],
    [analysis.data?.documents],
  );

  useEffect(() => {
    setSelectedDocumentIds((current) => {
      const available = new Set(documents.map((doc) => doc._id));
      const retained = current.filter((id) => available.has(id));
      return retained.length ? retained : defaultDocuments(documents);
    });
  }, [documents]);

  const selectedDocuments = documents.filter((doc) => selectedDocumentIds.includes(doc._id));
  const selectedCompanies = Array.from(new Set(selectedDocuments.map((doc) => doc.company_name)));
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Company Comparison</h1>
        <p className="mt-1 text-sm text-muted-foreground">Select filings from two or more companies to benchmark shared financial evidence</p>
      </div>

      {/* Document Selection */}
      <Card title="Select Reports" subtitle="Choose one filing per company for the cleanest peer benchmark">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase">1. Choose reports</p>
            <Badge variant={ready ? 'success' : 'warning'}>
              {selectedCompanies.length} of 2 companies selected
            </Badge>
          </div>

          {analysis.isLoading && <p className="text-sm text-muted-foreground">Loading available filings…</p>}
          {analysis.error && <p className="text-sm text-red-400">Could not load filings: {analysis.error.message}</p>}

          {documents.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {documents.map((doc) => {
                const checked = selectedDocumentIds.includes(doc._id);
                return (
                  <label
                    key={doc._id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      checked
                        ? 'border-primary-500/40 bg-primary-600/10'
                        : 'border-border bg-card hover:border-surface-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDocument(doc._id)}
                      className="h-4 w-4 rounded accent-primary-500"
                    />
                    <Building2 className={`h-5 w-5 shrink-0 ${checked ? 'text-primary-400' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.company_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.file_name || doc.document_type} · FY {doc.fiscal_year || 'not stated'}</p>
                    </div>
                    {checked && <CheckCircle2 className="h-4 w-4 text-primary-400 shrink-0" />}
                  </label>
                );
              })}
            </div>
          )}

          {!analysis.isLoading && documents.length === 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground-muted">No indexed filings available</p>
                <p className="text-xs text-muted-foreground">Upload company filings first, then return here to compare.</p>
              </div>
              <Link to="/workspace" className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-500">
                <FilePlus2 className="h-3.5 w-3.5" /> Upload
              </Link>
            </div>
          )}

          {!ready && documents.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground-muted">Another company filing needed</p>
                <p className="text-xs text-muted-foreground">Upload a similar report for a second company, then select both.</p>
              </div>
              <Link to="/workspace" className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-500">
                <FilePlus2 className="h-3.5 w-3.5" /> Upload
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {ready ? 'Only shared metrics for the selected companies will appear.' : 'Comparison is enabled after reports from two distinct companies are selected.'}
            </p>
            <button
              type="submit"
              disabled={busy || !ready}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary hover:bg-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GitCompare className="h-4 w-4" />
              {busy ? 'Comparing…' : 'Compare Selected'}
            </button>
          </div>
        </form>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && !result.eligibility.ready && (
        <Card>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground-muted">Comparison needs more data</p>
              <p className="text-xs text-muted-foreground">{result.eligibility.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {result?.eligibility.ready && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-500/10 p-2.5"><Scale className="h-5 w-5 text-primary-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-white">{result.coverage.company_count}</p>
                  <p className="text-xs text-muted-foreground">Companies compared</p>
                  <p className="text-xs text-muted-foreground">{result.coverage.selected_document_count} selected filings</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-500/10 p-2.5"><Sparkles className="h-5 w-5 text-primary-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-white">{result.benchmark_insights.length}</p>
                  <p className="text-xs text-muted-foreground">Benchmark observations</p>
                  <p className="text-xs text-muted-foreground">{result.coverage.comparable_metric_rows} shared metric rows</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-500/10 p-2.5"><ShieldAlert className="h-5 w-5 text-primary-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-white">{result.coverage.red_flags_considered}</p>
                  <p className="text-xs text-muted-foreground">Risk signals</p>
                  <p className="text-xs text-muted-foreground">Across selected companies</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Benchmark Insights */}
          {result.benchmark_insights.length > 0 && (
            <Card title="Benchmark Observations" subtitle="Peer view across selected companies">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {result.benchmark_insights.map((insight) => (
                  <div key={`${insight.metric_key}-${insight.period}-${insight.leader}`} className="rounded-lg border border-border bg-card p-4">
                    <Badge variant="info">{insight.period || 'Reported period'}</Badge>
                    <h4 className="mt-2 text-sm font-medium text-foreground">{insight.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{insight.detail}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {insight.citations.map((c) => `${c.company_name} p. ${c.page ?? 'n/a'}`).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Comparison Table */}
          {result.comparison.length > 0 && (
            <Card title="Financial Benchmark Matrix" subtitle="Shared metrics only">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Metric</th>
                      <th className="pb-3 pr-4 font-medium">Period</th>
                      {companies.map((company) => (
                        <th key={company} className="pb-3 pr-4 font-medium">{company}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.comparison.map((row) => (
                      <tr key={`${row.metric_key}-${row.period ?? 'na'}`} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4">
                          <p className="text-sm font-medium text-foreground">{row.metric_name}</p>
                          <p className="text-xs text-muted-foreground">{row.normalization_note}</p>
                        </td>
                        <td className="py-3 pr-4 text-foreground-muted">{row.period ?? 'Not stated'}</td>
                        {companies.map((company) => {
                          const cell = row.companies[company];
                          return (
                            <td key={company} className="py-3 pr-4">
                              {cell ? (
                                <div>
                                  <p className="font-semibold text-foreground">{cell.display_value}</p>
                                  <p className="text-xs text-muted-foreground">p. {cell.source_page ?? 'n/a'} · {Math.round(cell.confidence * 100)}%</p>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not reported</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Risk Summary */}
          {result.risk_summary.length > 0 && (
            <Card title="Company Risk Summary" subtitle="Risk profile for each company">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {result.risk_summary.map((risk) => (
                  <div key={risk.company_name} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">{risk.company_name}</h4>
                      <Badge variant={risk.highest_severity === 'critical' || risk.highest_severity === 'high' ? 'error' : risk.highest_severity === 'medium' ? 'warning' : 'neutral'}>
                        {risk.highest_severity}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white">{risk.risk_score}</p>
                    <p className="text-xs text-muted-foreground">Risk intensity score</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {risk.critical_or_high} high-priority signal{risk.critical_or_high === 1 ? '' : 's'} · {risk.red_flag_count} total
                    </p>
                    {risk.examples.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{risk.examples.join(' · ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
