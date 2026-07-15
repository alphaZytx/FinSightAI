import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, User, LogOut, Activity, AlertTriangle, Sun, Moon } from 'lucide-react';
import { clearSession, getSession } from '../../utils/auth';
import { getHealth } from '../../services/api/health';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  sidebarCollapsed: boolean;
}

export default function Navbar({ sidebarCollapsed }: NavbarProps) {
  const navigate = useNavigate();
  const session = getSession();
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, refetchInterval: 15000, retry: 1 });
  const isApiOnline = health.data?.status === 'ok';
  const { theme, toggleTheme } = useTheme();

  function handleSignOut() {
    clearSession();
    navigate('/login');
  }

  return (
    <header
      className={`fixed right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-6 backdrop-blur-md transition-all duration-300 ${
        sidebarCollapsed ? 'left-[72px]' : 'left-64'
      }`}
    >
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search companies, reports, documents..."
          className="w-full rounded-lg border border-border bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Backend health indicator */}
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            isApiOnline
              ? 'border-success-border bg-success text-success-foreground'
              : 'border-warning-border bg-warning text-warning-foreground'
          }`}
          title="Backend health"
        >
          {isApiOnline ? <Activity className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {isApiOnline ? 'API Online' : 'API Offline'}
        </span>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground-muted"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <button
          type="button"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground-muted"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-500" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20">
            <User className="h-4 w-4 text-primary-500" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium capitalize text-foreground">{session?.name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground">{session?.email ?? 'Analyst'}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className="ml-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground-muted"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

