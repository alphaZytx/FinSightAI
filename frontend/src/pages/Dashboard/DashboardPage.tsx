import { useQuery } from '@tanstack/react-query';
import { getWorkspaceAnalysis } from '../../services/api/workspaces';
import { getHealth } from '../../services/api/health';
import { getSession } from '../../utils/auth';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  WelcomeBanner,
  QuickActions,
  RecentActivity,
  AgentStatusPanel,
  ResearchProgress,
  FinancialCharts,
  NotificationsPanel,
} from '../../components/Dashboard';
import { LiveStatisticsCards } from '../../components/Dashboard/LiveStatisticsCards';
import { WorkspaceInsights } from '../../components/Dashboard/WorkspaceInsights';

export default function DashboardPage() {
  const session = getSession();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const analysis = useQuery({
    queryKey: ['workspace-analysis', activeWorkspaceId],
    queryFn: () => getWorkspaceAnalysis(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
  });

  const health = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 15000,
    retry: 1,
  });

  const isApiOnline = health.data?.status === 'ok';

  return (
    <div className="space-y-6">
      <WelcomeBanner userName={session?.name ?? 'Analyst'} />

      {/* Live stats from backend when available, otherwise show mock */}
      {analysis.data ? (
        <LiveStatisticsCards analysis={analysis.data} />
      ) : (
        <LiveStatisticsCards />
      )}

      <QuickActions />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Show real workspace insights when data is available */}
          {analysis.isLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-4">
              <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Loading document intelligence…</span>
            </div>
          )}
          {analysis.error && (
            <div className="rounded-lg border border-error-border bg-error p-4">
              <p className="text-sm text-error-foreground">Could not load analysis: {analysis.error.message}</p>
            </div>
          )}
          {analysis.data && <WorkspaceInsights analysis={analysis.data} />}

          <RecentActivity />
          <FinancialCharts analysis={analysis.data} />
        </div>

        <div className="space-y-6">
          {/* Backend status indicator */}
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
            isApiOnline ? 'border-success-border bg-success' : 'border-warning-border bg-warning'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isApiOnline ? 'bg-success-foreground' : 'bg-warning-foreground animate-pulse'}`} />
            <span className={`text-sm font-medium ${isApiOnline ? 'text-success-foreground' : 'text-warning-foreground'}`}>
              {isApiOnline ? 'API Online' : 'API Offline'}
            </span>
          </div>

          <AgentStatusPanel />
          <ResearchProgress />
          <NotificationsPanel />
        </div>
      </div>
    </div>
  );
}
