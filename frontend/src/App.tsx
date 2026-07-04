import { NavLink, Route, Routes } from 'react-router-dom';
import { BarChart3, FileText, GitCompare, MessageSquareText, UploadCloud } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import DocumentUpload from './pages/DocumentUpload';
import ResearchChat from './pages/ResearchChat';
import Comparison from './pages/Comparison';
import ReportBuilder from './pages/ReportBuilder';
import BackendStatus from './components/system/BackendStatus';
import { useWorkspaceStore } from './store/workspaceStore';

export default function App() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  return (
    <div className="app-shell">
      <nav className="navbar">
        <NavLink to="/" className="brand-link">FinSightAI</NavLink>
        <div className="nav-links">
          <NavLink to="/upload"><UploadCloud size={17} />Upload</NavLink>
          <NavLink to="/research"><MessageSquareText size={17} />Research</NavLink>
          <NavLink to="/comparison"><GitCompare size={17} />Compare</NavLink>
          <NavLink to="/reports"><FileText size={17} />Reports</NavLink>
          {activeWorkspaceId && <NavLink to={`/workspace/${activeWorkspaceId}`}><BarChart3 size={17} />Workspace</NavLink>}
        </div>
        <div className="nav-meta">
          {activeWorkspaceId && <span className="workspace-pill">{activeWorkspaceId}</span>}
          <BackendStatus />
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workspace/:workspaceId" element={<Workspace />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/research" element={<ResearchChat />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/reports" element={<ReportBuilder />} />
        </Routes>
      </main>
    </div>
  );
}