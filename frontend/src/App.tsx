import { useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, GitCompare, MessageSquareText, UploadCloud } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import DocumentUpload from './pages/DocumentUpload';
import ResearchChat from './pages/ResearchChat';
import Comparison from './pages/Comparison';
import ReportBuilder from './pages/ReportBuilder';
import BackendStatus from './components/system/BackendStatus';
import { getDefaultWorkspace } from './api/workspaces';
import { useWorkspaceStore } from './store/workspaceStore';

export default function App() {
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);
  const defaultWorkspace = useQuery({ queryKey: ['default-workspace'], queryFn: getDefaultWorkspace, retry: 1 });

  useEffect(() => {
    if (defaultWorkspace.data?._id) setActiveWorkspaceId(defaultWorkspace.data._id);
  }, [defaultWorkspace.data?._id, setActiveWorkspaceId]);

  return (
    <div className="app-shell">
      <nav className="navbar">
        <NavLink to="/" className="brand-link">FinSightAI</NavLink>
        <div className="nav-links">
          <NavLink to="/upload"><UploadCloud size={17} />Upload</NavLink>
          <NavLink to="/research"><MessageSquareText size={17} />Research</NavLink>
          <NavLink to="/comparison"><GitCompare size={17} />Compare</NavLink>
          <NavLink to="/reports"><FileText size={17} />Reports</NavLink>
        </div>
        <div className="nav-meta"><BackendStatus /></div>
      </nav>
      <main className="container">
        {defaultWorkspace.error && <p className="error-text">Could not initialize the research context. Refresh once the API is online.</p>}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/research" element={<ResearchChat />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/reports" element={<ReportBuilder />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}
