import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { router } from './routes';
import { getDefaultWorkspace } from './services/api/workspaces';
import { useWorkspaceStore } from './store/workspaceStore';

function WorkspaceInitializer() {
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);
  const defaultWorkspace = useQuery({
    queryKey: ['default-workspace'],
    queryFn: getDefaultWorkspace,
    retry: 1,
  });

  useEffect(() => {
    if (defaultWorkspace.data?._id) setActiveWorkspaceId(defaultWorkspace.data._id);
  }, [defaultWorkspace.data?._id, setActiveWorkspaceId]);

  return null;
}

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <WorkspaceInitializer />
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

export default App;
