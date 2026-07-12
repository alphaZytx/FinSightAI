import { create } from 'zustand';

const STORAGE_KEY = 'finsight.activeWorkspaceId';

type WorkspaceState = {
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  clearActiveWorkspaceId: () => void;
};

function readInitialWorkspaceId() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORAGE_KEY) ?? '';
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: readInitialWorkspaceId(),
  setActiveWorkspaceId: (id) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, id);
    set({ activeWorkspaceId: id });
  },
  clearActiveWorkspaceId: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    set({ activeWorkspaceId: '' });
  },
}));
