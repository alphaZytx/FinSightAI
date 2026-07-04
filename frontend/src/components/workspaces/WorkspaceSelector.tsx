import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { listWorkspaces } from '../../api/workspaces';
import { useWorkspaceStore } from '../../store/workspaceStore';

type Props = {
  label?: string;
};

export default function WorkspaceSelector({ label = 'Workspace' }: Props) {
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore();
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: listWorkspaces });

  return (
    <label>
      {label}
      <div className="workspace-select-row">
        <select
          value={activeWorkspaceId}
          onChange={(event) => setActiveWorkspaceId(event.target.value)}
          aria-label="Active workspace"
        >
          <option value="">Select a workspace</option>
          {workspaces.data?.map((workspace) => (
            <option value={workspace._id} key={workspace._id}>
              {workspace.name} ({workspace._id})
            </option>
          ))}
        </select>
        {activeWorkspaceId && <CheckCircle2 className="selected-icon" size={18} aria-label="Workspace selected" />}
      </div>
      {workspaces.error && <span className="error-text">Could not load workspaces</span>}
    </label>
  );
}