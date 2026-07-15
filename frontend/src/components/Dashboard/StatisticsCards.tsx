import { Search, FileText, Building2, BarChart3 } from 'lucide-react';
import type { StatCard } from '../../types';
import { mockStats } from '../../services/mockData';

const iconMap = {
  search: Search,
  file: FileText,
  building: Building2,
  report: BarChart3,
};

interface StatisticsCardsProps {
  stats?: StatCard[];
}

export default function StatisticsCards({ stats = mockStats }: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon as keyof typeof iconMap] ?? BarChart3;
        return (
          <div
            key={stat.label}
            className="group rounded-xl border border-border bg-muted p-5 transition-all hover:border-primary-500/30 hover:bg-muted"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-primary-500/10 p-2.5">
                <Icon className="h-5 w-5 text-primary-400" />
              </div>
              {stat.change && (
                <span className="text-xs text-emerald-400">{stat.change}</span>
              )}
            </div>
            <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
