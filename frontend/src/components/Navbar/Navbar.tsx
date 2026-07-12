import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, User, LogOut, Activity, AlertTriangle } from 'lucide-react';
import { clearSession, getSession } from '../../utils/auth';
import { getHealth } from '../../services/api/health';

interface NavbarProps {
  sidebarCollapsed: boolean;
}

export default function Navbar({ sidebarCollapsed }: NavbarProps) {
  const navigate = useNavigate();
  const session = getSession();
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, refetchInterval: 15000, retry: 1 });
  const isApiOnline = health.data?.status === 'ok';

  function handleSignOut() {
    clearSession();
    navigate('/login');
  }

  return (
    <header
      className={`fixed right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-surface-700/60 bg-surface-900/80 px-6 backdrop-blur-md transition-all duration-300 ${
        sidebarCollapsed ? 'left-[72px]' : 'left-64'
      }`}
    >
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
        <input
          type="text"
          placeholder="Search companies, reports, documents..."
          className="w-full rounded-lg border border-surface-700/60 bg-surface-800/50 py-2 pl-10 pr-4 text-sm text-surface-100 placeholder:text-surface-500 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Backend health indicator */}
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            isApiOnline
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}
          title="Backend health"
        >
          {isApiOnline ? <Activity className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {isApiOnline ? 'API Online' : 'API Offline'}
        </span>

        <button
          type="button"
          className="relative rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-500" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-surface-700/60 bg-surface-800/50 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600/30">
            <User className="h-4 w-4 text-primary-300" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium capitalize text-surface-100">{session?.name ?? 'User'}</p>
            <p className="text-xs text-surface-400">{session?.email ?? 'Analyst'}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className="ml-1 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

