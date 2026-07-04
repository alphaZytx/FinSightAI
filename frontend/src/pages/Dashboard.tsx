import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, RefreshCw, UploadCloud } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { createWorkspace, listWorkspaces } from '../api/workspaces';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: listWorkspaces });
  const create = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (workspace) => {
      setName('');
      setDescription('');
      setActiveWorkspaceId(workspace._id);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), description: description.trim() || undefined });
  }

  return (
    <>
      <PageHeader title="FinSightAI Dashboard" subtitle="Workspace control for document ingestion, cited research, comparison, and reports." />
      <section className="summary-strip">
        <article className="summary-tile">
          <span>Active workspace</span>
          <strong>{activeWorkspaceId || 'None selected'}</strong>
        </article>
        <article className="summary-tile">
          <span>Total workspaces</span>
          <strong>{workspaces.data?.length ?? 0}</strong>
        </article>
        <article className="summary-tile">
          <span>MVP mode</span>
          <strong>Deterministic RAG</strong>
        </article>
      </section>

      <section className="workspace-grid">
        <form className="card form-card" onSubmit={submit}>
          <h2>New workspace</h2>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tesla FY2025 review" />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Annual report, peer review, and risk notes" />
          </label>
          <button type="submit" disabled={create.isPending}>
            <FolderPlus size={18} />
            {create.isPending ? 'Creating' : 'Create and select'}
          </button>
          {create.error && <p className="error-text">{create.error.message}</p>}
        </form>

        <section className="card list-card">
          <div className="section-title-row">
            <h2>Workspaces</h2>
            <button type="button" className="icon-button" onClick={() => workspaces.refetch()} aria-label="Refresh workspaces">
              <RefreshCw size={18} />
            </button>
          </div>
          {workspaces.isLoading && <p className="muted">Loading workspaces...</p>}
          {workspaces.error && <p className="error-text">{workspaces.error.message}</p>}
          {workspaces.data?.length === 0 && <p className="muted">No workspaces yet.</p>}
          <div className="stack">
            {workspaces.data?.map((workspace) => (
              <article className={workspace._id === activeWorkspaceId ? 'workspace-row selected' : 'workspace-row'} key={workspace._id}>
                <div>
                  <strong>{workspace.name}</strong>
                  <span>{workspace._id}</span>
                </div>
                {workspace.description && <p>{workspace.description}</p>}
                <div className="row-actions">
                  <button type="button" className="secondary-button" onClick={() => setActiveWorkspaceId(workspace._id)}>
                    Select
                  </button>
                  <Link className="secondary-link" to="/upload">
                    <UploadCloud size={16} />
                    Upload
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}