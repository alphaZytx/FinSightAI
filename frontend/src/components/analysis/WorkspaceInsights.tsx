import { BarChart3, FileCheck2, FileText, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WorkspaceAnalysis } from '../../types/analysis';

function formatMetric(value: number | null, unit?: string | null) {
  if (value === null || value === undefined) return 'Not reported';
  if (unit === 'percent') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  if (unit === 'x') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;
}

function severityClass(severity: string) {
  return `severity severity-${severity.toLowerCase()}`;
}

type Props = {
  analysis: WorkspaceAnalysis;
};

export default function WorkspaceInsights({ analysis }: Props) {
  const { summary, documents, metrics, red_flags: redFlags } = analysis;
  const visibleMetrics = metrics.slice(0, 12);
  const visibleFlags = redFlags.slice(0, 6);

  if (!summary.pipeline_ready) {
    return (
      <section className="analysis-empty" aria-live="polite">
        <Sparkles size={24} aria-hidden="true" />
        <div>
          <h2>Analysis desk is ready</h2>
          <p>Upload a filing to populate source-backed metrics, risk signals, comparisons, and reports.</p>
        </div>
        <Link to="/upload" className="primary-link">Upload a filing</Link>
      </section>
    );
  }

  return (
    <section className="analysis-workbench" aria-label="Financial analysis">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Research intelligence</p>
          <h2>Research overview</h2>
        </div>
        <span className="analysis-status"><span className="status-dot" />{summary.indexed_document_count} indexed document{summary.indexed_document_count === 1 ? '' : 's'}</span>
      </div>

      <div className="analysis-kpi-grid">
        <article className="analysis-kpi">
          <FileText size={20} aria-hidden="true" />
          <span>Documents</span>
          <strong>{summary.document_count}</strong>
          <small>{summary.company_count} {summary.company_count === 1 ? 'company' : 'companies'}</small>
        </article>
        <article className="analysis-kpi">
          <BarChart3 size={20} aria-hidden="true" />
          <span>Extracted metrics</span>
          <strong>{summary.metric_count}</strong>
          <small>Source-linked values and ratios</small>
        </article>
        <article className="analysis-kpi">
          <ShieldAlert size={20} aria-hidden="true" />
          <span>Priority risks</span>
          <strong>{summary.high_priority_flag_count}</strong>
          <small>{summary.red_flag_count} total risk signals</small>
        </article>
        <article className="analysis-kpi">
          <FileCheck2 size={20} aria-hidden="true" />
          <span>Agent coverage</span>
          <strong>{summary.pipeline_ready ? 'Ready' : 'Waiting'}</strong>
          <small>Index, extract, scan, compare</small>
        </article>
      </div>

      <div className="analysis-grid">
        <section className="analysis-panel metrics-panel">
          <div className="section-title-row">
            <div>
              <h3>Financial evidence</h3>
              <p>Reported values remain separate from derived ratios.</p>
            </div>
            <Link className="text-link" to="/comparison">Compare peers</Link>
          </div>
          {visibleMetrics.length === 0 ? <p className="muted">No financial values have been saved yet.</p> : (
            <div className="table-scroll">
              <table className="analytics-table">
                <thead>
                  <tr><th>Company</th><th>Metric</th><th>Period</th><th>Reported value</th><th>Source</th></tr>
                </thead>
                <tbody>
                  {visibleMetrics.map((metric) => (
                    <tr key={metric._id}>
                      <td>{metric.company_name}</td>
                      <td><strong>{metric.display_name || metric.metric_name}</strong><small className="method-label">{metric.extraction_method === 'derived_ratio' ? 'Derived' : 'Reported'}</small></td>
                      <td>{metric.period || 'Not stated'}</td>
                      <td>{formatMetric(metric.value, metric.unit)}</td>
                      <td>p. {metric.source_page ?? 'n/a'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="analysis-panel risk-panel">
          <div className="section-title-row">
            <div>
              <h3>Risk watchlist</h3>
              <p>Quantitative checks and filing language, ordered by severity.</p>
            </div>
            <Link className="text-link" to="/reports">Build report</Link>
          </div>
          {visibleFlags.length === 0 ? <p className="muted">No red flags were detected by the current evidence rules.</p> : (
            <div className="risk-list">
              {visibleFlags.map((flag) => (
                <article className="risk-item" key={flag._id}>
                  <div className="risk-item-topline"><span className={severityClass(flag.severity)}>{flag.severity}</span><span>{flag.company_name}</span></div>
                  <h4>{flag.title}</h4>
                  <p>{flag.explanation}</p>
                  <small>Source: page {flag.source_page ?? 'n/a'} · confidence {Math.round((flag.confidence ?? 0) * 100)}%</small>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="document-coverage">
        <div className="section-title-row">
          <div><h3>Document coverage</h3><p>Agent readiness for the uploaded files.</p></div>
          <Link className="text-link" to="/upload">Add document</Link>
        </div>
        <div className="document-list">
          {documents.map((document) => (
            <article className="document-row" key={document._id}>
              <FileText size={18} aria-hidden="true" />
              <div><strong>{document.file_name || document.company_name}</strong><span>{document.company_name} · {document.fiscal_year || 'Fiscal year not stated'} · {document.document_type || 'Document'}</span></div>
              <span className={`document-status status-${document.status}`}>{document.status}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
