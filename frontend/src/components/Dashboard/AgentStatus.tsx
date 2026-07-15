import { Bot, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import type { Agent, AgentStatus } from '../../types';
import { mockAgents } from '../../services/mockData';
import { Badge, Card } from '../Common';

const statusConfig: Record<AgentStatus, { variant: 'success' | 'warning' | 'error' | 'neutral'; icon: typeof CheckCircle2 }> = {
  Ready: { variant: 'success', icon: CheckCircle2 },
  Processing: { variant: 'warning', icon: Loader2 },
  Idle: { variant: 'neutral', icon: Bot },
  Error: { variant: 'error', icon: AlertCircle },
};

interface AgentStatusPanelProps {
  agents?: Agent[];
}

export default function AgentStatusPanel({ agents = mockAgents }: AgentStatusPanelProps) {
  return (
    <Card title="AI Agent Status" subtitle="Specialized agent readiness">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Agent</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const config = statusConfig[agent.status];
              const StatusIcon = config.icon;
              return (
                <tr key={agent.name} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary-400" />
                      <span className="text-foreground-muted">{agent.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={config.variant}>
                      <StatusIcon className={`mr-1 inline h-3 w-3 ${agent.status === 'Processing' ? 'animate-spin' : ''}`} />
                      {agent.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
