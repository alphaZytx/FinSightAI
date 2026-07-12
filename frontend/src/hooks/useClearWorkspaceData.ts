import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { clearWorkspaceData } from '../services/api/workspaces';
import { useWorkspaceStore } from '../store/workspaceStore';

const DEFAULT_CONFIRM_MESSAGE =
  'This will permanently delete all uploaded documents, extracted metrics, red flags, and analysis data in this workspace.\n\nThis cannot be undone. Are you sure you want to start fresh?';

export function useClearWorkspaceData() {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function clearAll(confirmMessage = DEFAULT_CONFIRM_MESSAGE): Promise<boolean> {
    if (!activeWorkspaceId) return false;
    if (!confirm(confirmMessage)) return false;

    setClearing(true);
    setError(null);
    try {
      await clearWorkspaceData(activeWorkspaceId);
      await queryClient.invalidateQueries({ queryKey: ['workspace-analysis', activeWorkspaceId] });
      await queryClient.invalidateQueries({ queryKey: ['comparison-documents', activeWorkspaceId] });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear workspace data');
      return false;
    } finally {
      setClearing(false);
    }
  }

  return { clearAll, clearing, error, setError };
}
