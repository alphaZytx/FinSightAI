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
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border backdrop-blur-md transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      } ${isLight ? 'bg-gradient-to-b from-[#f0f4ff] to-[#f8f9ff]' : 'bg-card'}`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isLight ? 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/25' : 'bg-primary-600'
        }`}>
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-foreground">FinSightAI</p>
            <p className="text-[10px] text-muted-foreground">Financial Research</p>
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? isLight
                    ? 'bg-primary-50 text-primary-700 border-l-[3px] border-primary-600 shadow-sm'
                    : 'bg-primary-500/10 text-primary-500'
                  : isLight
                    ? 'text-foreground-subtle hover:bg-primary-50/50 hover:text-primary-700'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${
                isActive
                  ? isLight ? 'text-primary-600' : 'text-primary-500'
                  : ''
              }`} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onToggle}
        className="flex h-12 items-center justify-center border-t border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground-muted"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
