import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, GitCompare, MessageSquareText, UploadCloud } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Workspace() {
  const { workspaceId } = useParams();
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);

  useEffect(() => {
    if (workspaceId) setActiveWorkspaceId(workspaceId);
  }, [workspaceId, setActiveWorkspaceId]);

  return (
    <>
      <PageHeader title="Workspace" subtitle={workspaceId ? `Active workspace: ${workspaceId}` : 'Select a workspace from the dashboard.'} />
      <section className="workflow-grid">
        <Link className="workflow-card" to="/upload"><UploadCloud size={22} /><strong>Upload documents</strong><span>Parse, chunk, embed, extract, and scan risks.</span></Link>
        <Link className="workflow-card" to="/research"><MessageSquareText size={22} /><strong>Ask research questions</strong><span>Retrieve cited source chunks for grounded answers.</span></Link>
        <Link className="workflow-card" to="/comparison"><GitCompare size={22} /><strong>Compare companies</strong><span>Review normalized metrics and risk summaries.</span></Link>
        <Link className="workflow-card" to="/reports"><FileText size={22} /><strong>Generate report</strong><span>Create a PDF from saved metrics and red flags.</span></Link>
      </section>
    </>
  );
}