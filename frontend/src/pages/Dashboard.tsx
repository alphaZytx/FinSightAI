import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, FileText, GitCompare, ShieldAlert, UploadCloud } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import WorkspaceInsights from '../components/analysis/WorkspaceInsights';
import { getWorkspaceAnalysis } from '../api/workspaces';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Dashboard() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const analysis = useQuery({
    queryKey: ['research-analysis', activeWorkspaceId],
    queryFn: () => getWorkspaceAnalysis(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
  });

  return (
    <>
      <PageHeader title="Financial Research" subtitle="Upload filings, review source-backed evidence, compare company performance, and generate an analyst report." />
      <section className="summary-strip">
        <article className="summary-tile"><FileText size={19} /><span>Indexed documents</span><strong>{analysis.data?.summary.indexed_document_count ?? 0}</strong></article>
        <article className="summary-tile"><BarChart3 size={19} /><span>Key metrics</span><strong>{analysis.data?.summary.metric_count ?? 0}</strong></article>
        <article className="summary-tile"><ShieldAlert size={19} /><span>Priority risks</span><strong>{analysis.data?.summary.high_priority_flag_count ?? 0}</strong></article>
        <article className="summary-tile"><GitCompare size={19} /><span>Research mode</span><strong>Grounded analysis</strong></article>
      </section>

      <section className="research-actions" aria-label="Research actions">
        <Link to="/upload"><UploadCloud size={19} /><span><strong>Upload filing</strong><small>Parse, extract, and scan risk indicators.</small></span><ArrowRight size={18} /></Link>
        <Link to="/research"><BarChart3 size={19} /><span><strong>Ask research</strong><small>Get a source-cited answer from your documents.</small></span><ArrowRight size={18} /></Link>
        <Link to="/reports"><FileText size={19} /><span><strong>Generate report</strong><small>Create a cited PDF research summary.</small></span><ArrowRight size={18} /></Link>
      </section>

      {analysis.isLoading && <section className="analysis-loading"><span className="status-dot" />Loading document intelligence...</section>}
      {analysis.error && <p className="error-text">Could not load the current analysis: {analysis.error.message}</p>}
      {analysis.data && <WorkspaceInsights analysis={analysis.data} />}
    </>
  );
}
