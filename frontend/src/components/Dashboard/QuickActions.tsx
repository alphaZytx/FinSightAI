import { Link } from 'react-router-dom';
import { Upload, Search, GitCompare, MessageSquare, FileOutput } from 'lucide-react';
import { Card } from '../Common';
import { useTheme } from '../../context/ThemeContext';

const actions = [
  {
    label: 'Upload Financial Report',
    icon: Upload,
    path: '/workspace',
    lightColor: 'text-blue-600 bg-blue-100',
    darkColor: 'text-info-foreground bg-info',
  },
  {
    label: 'Start New Research',
    icon: Search,
    path: '/workspace',
    lightColor: 'text-emerald-600 bg-emerald-100',
    darkColor: 'text-success-foreground bg-success',
  },
  {
    label: 'Compare Companies',
    icon: GitCompare,
    path: '/comparison',
    lightColor: 'text-violet-600 bg-violet-100',
    darkColor: 'text-accent-purple bg-accent-purple-bg',
  },
  {
    label: 'Open AI Chat',
    icon: MessageSquare,
    path: '/chat',
    lightColor: 'text-cyan-600 bg-cyan-100',
    darkColor: 'text-accent-cyan bg-accent-cyan-bg',
  },
  {
    label: 'Generate Report',
    icon: FileOutput,
    path: '/reports',
    lightColor: 'text-amber-600 bg-amber-100',
    darkColor: 'text-warning-foreground bg-warning',
  },
];

export default function QuickActions() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <Card title="Quick Actions" subtitle="Jump into common tasks">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {actions.map(({ label, icon: Icon, path, lightColor, darkColor }) => (
          <Link
            key={label}
            to={path}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary-500/30 hover:bg-muted hover:shadow-md"
          >
            <div className={`rounded-xl p-3 ${isLight ? lightColor : darkColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground-muted">{label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
