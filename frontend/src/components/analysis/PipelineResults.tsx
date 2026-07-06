import { AlertCircle, CheckCircle2, FileSearch, GitCompare, ShieldAlert, Sigma } from 'lucide-react';
import type { IngestResponse } from '../../api/documents';

function formatMetric(value: number | null, unit?: string | null) {
  if (value === null || value === undefined) return 'Not reported';
  if (unit === 'percent') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  if (unit === 'x') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;
}

type Props = { result: IngestResponse };

export default function PipelineResults({ result }: Props) {
  const document = result.results.document;
  const extraction = result.results.extraction;
  const risks = result.results.red_flags;
  const comparison = result.results.comparison;
  const steps = [
    { label: 'Document index', icon: FileSearch, status: document?.status, detail: document?.output?.chunks_created ? `${document.output.pages_processed ?? 0} pages · ${document.output.chunks_created} chunks` : undefined },
    { label: 'Financial extraction', icon: Sigma, status: extraction?.status, detail: extraction?.output?.metrics_saved !== undefined ? `${extraction.output.metrics_saved} saved · ${extraction.output.derived_ratio_count ?? 0} derived` : undefined },
    { label: 'Risk scan', icon: ShieldAlert, status: risks?.status, detail: risks?.output?.red_flags_saved !== undefined ? `${risks.output.red_flags_saved} signals saved` : undefined },
    { label: 'Peer comparison', icon: GitCompare, status: comparison?.status, detail: comparison?.output?.coverage?.company_count ? `${comparison.output.coverage.company_count} companies in scope` : undefined },
  ];
  const errors = steps.flatMap((step, index) => {
    const agent = [document, extraction, risks, comparison][index];
    return agent?.errors ?? [];
  });

  return (
    <section className="pipeline-results" aria-live="polite">
      <div className="pipeline-heading"><div><p className="eyebrow">Ingestion complete</p><h2>Agent analysis summary</h2></div><span className="pipeline-document-id">{result.document_id}</span></div>
      <div className="pipeline-steps">
        {steps.map((step) => {
          const Icon = step.icon;
          const successful = step.status === 'success';
          return <article className={`pipeline-step ${successful ? 'is-complete' : step.status === 'failed' ? 'is-failed' : ''}`} key={step.label}>
            <Icon size={19} aria-hidden="true" />
            <div><strong>{step.label}</strong><span>{step.detail || (step.status ? step.status : 'Not run')}</span></div>
            {successful ? <CheckCircle2 size={19} aria-label="Completed" /> : step.status === 'failed' ? <AlertCircle size={19} aria-label="Failed" /> : null}
          </article>;
        })}
      </div>
      {extraction?.output?.metrics?.length ? (
        <section className="pipeline-detail">
          <h3>Key financial evidence</h3>
          <div className="pipeline-metric-list">
            {extraction.output.metrics.slice(0, 6).map((metric) => <span key={metric._id}><strong>{metric.display_name || metric.metric_name}</strong>{formatMetric(metric.value, metric.unit)}<small>p. {metric.source_page ?? 'n/a'}</small></span>)}
          </div>
        </section>
      ) : null}
      {risks?.output?.red_flags?.length ? (
        <section className="pipeline-detail">
          <h3>Risk signals</h3>
          <div className="pipeline-risk-list">
            {risks.output.red_flags.slice(0, 4).map((flag) => <article key={flag._id}><span className={`severity severity-${flag.severity}`}>{flag.severity}</span><div><strong>{flag.title}</strong><p>{flag.explanation}</p><small>Source: page {flag.source_page ?? 'n/a'}</small></div></article>)}
          </div>
        </section>
      ) : null}
      {errors.length > 0 && <p className="error-text">{errors.join(' ')}</p>}
    </section>
  );
}
