import { FileText, BarChart3, ShieldAlert, FileCheck2 } from 'lucide-react';
import type { WorkspaceAnalysis } from '../../types';
import { mockStats } from '../../services/mockData';
import { useTheme } from '../../context/ThemeContext';

interface LiveStatisticsCardsProps {
  analysis?: WorkspaceAnalysis;
}

const cardAccents = [
  { border: 'border-l-blue-500',    iconBg: 'bg-blue-100',    iconBgDark: 'bg-primary-500/10',   iconColor: 'text-blue-600',    iconColorDark: 'text-primary-400' },
  { border: 'border-l-emerald-500', iconBg: 'bg-emerald-100', iconBgDark: 'bg-primary-500/10',   iconColor: 'text-emerald-600', iconColorDark: 'text-primary-400' },
  { border: 'border-l-amber-500',   iconBg: 'bg-amber-100',   iconBgDark: 'bg-primary-500/10',   iconColor: 'text-amber-600',   iconColorDark: 'text-primary-400' },
  { border: 'border-l-violet-500',  iconBg: 'bg-violet-100',  iconBgDark: 'bg-primary-500/10',   iconColor: 'text-violet-600',  iconColorDark: 'text-primary-400' },
];

export function LiveStatisticsCards({ analysis }: LiveStatisticsCardsProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const stats = analysis
    ? [
        { label: 'Indexed Documents', value: analysis.summary.indexed_document_count, change: `${analysis.summary.company_count} companies`, icon: FileText },
        { label: 'Key Metrics', value: analysis.summary.metric_count, change: 'Source-linked values', icon: BarChart3 },
        { label: 'Priority Risks', value: analysis.summary.high_priority_flag_count, change: `${analysis.summary.red_flag_count} total`, icon: ShieldAlert },
        { label: 'Pipeline Status', value: analysis.summary.pipeline_ready ? 'Ready' : 'Waiting', change: 'Index, extract, scan', icon: FileCheck2 },
      ]
    : [
        { label: mockStats[0].label, value: mockStats[0].value, change: mockStats[0].change, icon: FileText },
        { label: mockStats[1].label, value: mockStats[1].value, change: mockStats[1].change, icon: BarChart3 },
        { label: mockStats[2].label, value: mockStats[2].value, change: mockStats[2].change, icon: ShieldAlert },
        { label: mockStats[3].label, value: mockStats[3].value, change: mockStats[3].change, icon: FileCheck2 },
      ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const accent = cardAccents[index % cardAccents.length];
        return (
          <div
            key={stat.label}
            className={`group rounded-xl border bg-card p-5 transition-all hover:border-primary-500/30 ${
              isLight
                ? `border-border border-l-4 ${accent.border}`
                : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${isLight ? accent.iconBg : accent.iconBgDark}`}>
                <Icon className={`h-5 w-5 ${isLight ? accent.iconColor : accent.iconColorDark}`} />
              </div>
              {stat.change && (
                <span className="text-xs text-success-foreground">{stat.change}</span>
              )}
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
