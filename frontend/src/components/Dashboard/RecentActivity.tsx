import { Upload, Brain, FileOutput, MessageSquare } from 'lucide-react';
import type { ActivityItem } from '../../types';
import { mockActivities } from '../../services/mockData';
import { formatRelativeTime } from '../../utils/formatters';
import { Card } from '../Common';

const typeConfig = {
  upload: { icon: Upload, color: 'text-blue-400 bg-blue-500/10' },
  analysis: { icon: Brain, color: 'text-purple-400 bg-purple-500/10' },
  report: { icon: FileOutput, color: 'text-emerald-400 bg-emerald-500/10' },
  chat: { icon: MessageSquare, color: 'text-cyan-400 bg-cyan-500/10' },
};

interface RecentActivityProps {
  activities?: ActivityItem[];
}

export default function RecentActivity({ activities = mockActivities }: RecentActivityProps) {
  return (
    <Card title="Recent Activity" subtitle="Latest workspace events">
      <div className="space-y-3">
        {activities.map((activity) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
            >
              <div className={`mt-0.5 rounded-lg p-2 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{activity.description}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
