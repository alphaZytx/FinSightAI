import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  GitCompare,
  FileText,
  MessageSquare,
  Settings,
  Brain,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Workspace', path: '/workspace', icon: FolderOpen },
  { label: 'Comparison', path: '/comparison', icon: GitCompare },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'AI Chat', path: '/chat', icon: MessageSquare },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-surface-700/60 bg-surface-900/95 backdrop-blur-md transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-surface-700/60 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600">
          <Brain className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white">FinSightAI</p>
            <p className="text-[10px] text-surface-400">Financial Research</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600/20 text-primary-300'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onToggle}
        className="flex h-12 items-center justify-center border-t border-surface-700/60 text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
