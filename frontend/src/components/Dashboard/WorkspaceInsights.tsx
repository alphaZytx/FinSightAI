import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, ChevronDown, ChevronUp, DollarSign, PieChart, Landmark, Banknote, Activity, ShieldAlert } from 'lucide-react';
import { Card, Badge } from '../Common';
import type { WorkspaceAnalysis, AnalysisMetric } from '../../types';

function formatMetric(value: number | null, unit?: string | null) {
  if (value === null || value === undefined) return 'Not reported';
  if (unit === 'percent') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  if (unit === 'x') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;
}

const METRIC_CATEGORIES: Record<string, { label: string; icon: typeof DollarSign; metrics: string[] }> = {
  income: {
    label: 'Income Statement',
    icon: DollarSign,
    metrics: ['revenue', 'cost_of_revenue', 'gross_profit', 'operating_expenses', 'sga_expense', 'rd_expense', 'depreciation', 'ebitda', 'operating_income', 'interest_expense', 'pretax_income', 'tax_expense', 'net_income', 'eps', 'dps'],
  },
  margins: {
    label: 'Margins & Returns',
    icon: PieChart,
    metrics: ['gross_margin', 'operating_margin', 'net_margin', 'ebitda_margin', 'roe', 'roa', 'roce', 'revenue_growth'],
  },
  balance: {
    label: 'Balance Sheet',
    icon: Landmark,
    metrics: ['total_assets', 'current_assets', 'cash', 'short_term_investments', 'accounts_receivable', 'inventory', 'non_current_assets', 'ppe', 'goodwill', 'total_liabilities', 'current_liabilities', 'accounts_payable', 'short_term_debt', 'long_term_debt', 'total_debt', 'total_equity', 'book_value_per_share'],
  },
  cashflow: {
    label: 'Cash Flow',
    icon: Banknote,
    metrics: ['operating_cash_flow', 'capex', 'free_cash_flow', 'investing_cash_flow', 'financing_cash_flow', 'dividends_paid'],
  },
  ratios: {
    label: 'Financial Ratios',
    icon: Activity,
    metrics: ['current_ratio', 'debt_to_equity', 'debt_to_ebitda', 'interest_coverage', 'working_capital'],
  },
};

function categorizeMetrics(metrics: AnalysisMetric[]) {
  const categorized: Record<string, AnalysisMetric[]> = {};
  const uncategorized: AnalysisMetric[] = [];
  const allCategoryMetrics = new Set(Object.values(METRIC_CATEGORIES).flatMap(c => c.metrics));

  for (const metric of metrics) {
    let placed = false;
    for (const [key, cat] of Object.entries(METRIC_CATEGORIES)) {
      if (cat.metrics.includes(metric.metric_name)) {
        (categorized[key] ??= []).push(metric);
        placed = true;
        break;
      }
    }
    if (!placed && !allCategoryMetrics.has(metric.metric_name)) {
      uncategorized.push(metric);
    }
  }
  return { categorized, uncategorized };
}

function MetricSection({ categoryKey, metrics, defaultOpen = false }: { categoryKey: string; metrics: AnalysisMetric[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cat = METRIC_CATEGORIES[categoryKey];
  if (!cat || metrics.length === 0) return null;
  const Icon = cat.icon;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
          <Icon className="h-4 w-4 text-primary-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{cat.label}</p>
        </div>
        <Badge variant="neutral">{metrics.length}</Badge>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-2" /> : <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />}
      </button>
      {open && (
        <div className="border-t border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="py-2 pl-4 pr-2 font-medium">Company</th>
                  <th className="py-2 px-2 font-medium">Metric</th>
                  <th className="py-2 px-2 font-medium">Period</th>
                  <th className="py-2 px-2 font-medium text-right">Value</th>
                  <th className="py-2 px-2 font-medium">Conf</th>
                  <th className="py-2 pl-2 pr-4 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/20">
                {metrics.map((metric) => {
                  const conf = metric.confidence ?? 0;
                  const confColor = conf >= 0.75 ? 'text-emerald-400' : conf >= 0.5 ? 'text-amber-400' : 'text-red-400';
                  
                  return (
                    <tr key={metric._id} className="hover:bg-muted transition-colors">
                      <td className="py-2 pl-4 pr-2 text-foreground-muted font-medium truncate max-w-[120px]">{metric.company_name}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{metric.display_name || metric.metric_name}</span>
                          {metric.extraction_method === 'derived_ratio' && (
                            <Badge variant="info">Derived</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">{metric.period || '-'}</td>
                      <td className="py-2 px-2 text-white font-semibold text-right whitespace-nowrap">{formatMetric(metric.value, metric.unit)}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs font-medium ${confColor}`}>{Math.round(conf * 100)}%</span>
                      </td>
                      <td className="py-2 pl-2 pr-4 text-muted-foreground text-xs whitespace-nowrap">p. {metric.source_page ?? 'n/a'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface WorkspaceInsightsProps {
  analysis: WorkspaceAnalysis;
}

export function WorkspaceInsights({ analysis }: WorkspaceInsightsProps) {
  const { summary, documents, metrics, red_flags: redFlags } = analysis;
  
  const { categorized, uncategorized } = categorizeMetrics(metrics);

  if (!summary.pipeline_ready) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600/15">
            <Sparkles className="h-7 w-7 text-primary-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-foreground-muted">Analysis desk is ready</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Upload a filing to populate source-backed metrics, risk signals, comparisons, and reports.
          </p>
          <Link
            to="/workspace"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
          >
            Upload a Filing
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Evidence section */}
      {metrics.length > 0 && (
        <Card
          title="Extracted Financial Data"
          subtitle={`${metrics.length} metrics extracted across ${summary.company_count} companies`}
          action={
            <Link to="/comparison" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Compare peers →
            </Link>
          }
        >
          <div className="mt-2">
            {Object.entries(METRIC_CATEGORIES).map(([key]) =>
              categorized[key]?.length ? (
                <MetricSection key={key} categoryKey={key} metrics={categorized[key]} defaultOpen={key === 'income' || key === 'margins'} />
              ) : null
            )}
            
            {uncategorized.length > 0 && (
              <div className="rounded-lg border border-border bg-card overflow-hidden mb-3">
                <div className="bg-muted px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Other Financial Data</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="py-2 pl-4 pr-2 font-medium">Company</th>
                        <th className="py-2 px-2 font-medium">Metric</th>
                        <th className="py-2 px-2 font-medium">Period</th>
                        <th className="py-2 px-2 font-medium text-right">Value</th>
                        <th className="py-2 pl-2 pr-4 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-700/20">
                      {uncategorized.map((metric) => (
                        <tr key={metric._id} className="hover:bg-muted transition-colors">
                          <td className="py-2 pl-4 pr-2 text-foreground-muted font-medium truncate max-w-[120px]">{metric.company_name}</td>
                          <td className="py-2 px-2 text-foreground">{metric.display_name || metric.metric_name}</td>
                          <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">{metric.period || '-'}</td>
                          <td className="py-2 px-2 text-white font-semibold text-right whitespace-nowrap">{formatMetric(metric.value, metric.unit)}</td>
                          <td className="py-2 pl-2 pr-4 text-muted-foreground text-xs whitespace-nowrap">p. {metric.source_page ?? 'n/a'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Risk Watchlist */}
      {redFlags.length > 0 && (
        <Card
          title="Risk Watchlist"
          subtitle={`${redFlags.length} signals detected in filing language and quantitative checks`}
          action={
            <Link to="/reports" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Build report →
            </Link>
          }
        >
          <div className="space-y-3 mt-2">
            {redFlags.slice(0, 10).map((flag) => (
              <div key={flag._id} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-surface-600/50">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    flag.severity === 'critical' ? 'bg-red-500/20' :
                    flag.severity === 'high' ? 'bg-orange-500/20' :
                    flag.severity === 'medium' ? 'bg-amber-500/20' : 'bg-surface-700/40'
                  }`}>
                    <ShieldAlert className={`h-3.5 w-3.5 ${
                      flag.severity === 'critical' ? 'text-red-400' :
                      flag.severity === 'high' ? 'text-orange-400' :
                      flag.severity === 'medium' ? 'text-amber-400' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={flag.severity === 'critical' || flag.severity === 'high' ? 'error' : flag.severity === 'medium' ? 'warning' : 'neutral'}>
                          {flag.severity}
                        </Badge>
                        <span className="text-xs font-medium text-foreground-muted">{flag.company_name}</span>
                        <span className="text-xs text-muted-foreground">· {flag.category}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">p. {flag.source_page ?? 'n/a'}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{flag.title}</p>
                    <p className="mt-1.5 text-sm text-foreground-muted leading-relaxed">{flag.explanation}</p>
                    {flag.evidence && (
                      <div className="mt-3 rounded border border-border bg-muted p-2.5">
                        <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">"{flag.evidence}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {redFlags.length > 10 && (
              <div className="text-center py-2">
                <span className="text-xs text-muted-foreground">+ {redFlags.length - 10} more risks detected</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Document Coverage */}
      {documents.length > 0 && (
        <Card
          title="Document Coverage"
          subtitle="Agent readiness for uploaded files"
          action={
            <Link to="/workspace" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Workspace →
            </Link>
          }
        >
          <div className="space-y-2 mt-2">
            {documents.slice(0, 5).map((doc) => (
              <div key={doc._id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-500/10 shrink-0">
                  <FileText className="h-4 w-4 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.file_name || doc.company_name}</p>
                  <p className="text-xs text-muted-foreground">{doc.company_name} · {doc.fiscal_year || 'FY not stated'} · {doc.document_type || 'Document'}</p>
                </div>
                <Badge variant={doc.status === 'indexed' ? 'success' : doc.status === 'uploaded' ? 'warning' : 'neutral'}>
                  {doc.status}
                </Badge>
              </div>
            ))}
            {documents.length > 5 && (
              <div className="text-center py-2">
                <span className="text-xs text-muted-foreground">+ {documents.length - 5} more documents</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
