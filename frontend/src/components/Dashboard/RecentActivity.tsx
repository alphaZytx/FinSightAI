import { Upload, Brain, FileOutput, MessageSquare } from 'lucide-react';
import type { ActivityItem } from '../../types';
import { mockActivities } from '../../services/mockData';
import { formatRelativeTime } from '../../utils/formatters';
import { Card } from '../Common';
import { useTheme } from '../../context/ThemeContext';

const typeConfig = {
  upload: {
    icon: Upload,
    lightColor: 'text-blue-600 bg-blue-100',
    darkColor: 'text-info-foreground bg-info',
  },
  analysis: {
    icon: Brain,
    lightColor: 'text-violet-600 bg-violet-100',
    darkColor: 'text-accent-purple bg-accent-purple-bg',
  },
  report: {
    icon: FileOutput,
    lightColor: 'text-emerald-600 bg-emerald-100',
    darkColor: 'text-success-foreground bg-success',
  },
  chat: {
    icon: MessageSquare,
    lightColor: 'text-cyan-600 bg-cyan-100',
    darkColor: 'text-accent-cyan bg-accent-cyan-bg',
  },
};

interface RecentActivityProps {
  activities?: ActivityItem[];
}

export default function RecentActivity({ activities = mockActivities }: RecentActivityProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
              <div className={`mt-0.5 rounded-lg p-2 ${isLight ? config.lightColor : config.darkColor}`}>
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
