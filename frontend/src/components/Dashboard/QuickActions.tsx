import { Link } from 'react-router-dom';
import { Upload, Search, GitCompare, MessageSquare, FileOutput } from 'lucide-react';
import { Card } from '../Common';

const actions = [
  { label: 'Upload Financial Report', icon: Upload, path: '/workspace', color: 'text-blue-400 bg-blue-500/10' },
  { label: 'Start New Research', icon: Search, path: '/workspace', color: 'text-emerald-400 bg-emerald-500/10' },
  { label: 'Compare Companies', icon: GitCompare, path: '/comparison', color: 'text-purple-400 bg-purple-500/10' },
  { label: 'Open AI Chat', icon: MessageSquare, path: '/chat', color: 'text-cyan-400 bg-cyan-500/10' },
  { label: 'Generate Report', icon: FileOutput, path: '/reports', color: 'text-amber-400 bg-amber-500/10' },
];

export default function QuickActions() {
  return (
    <Card title="Quick Actions" subtitle="Jump into common tasks">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {actions.map(({ label, icon: Icon, path, color }) => (
          <Link
            key={label}
            to={path}
            className="flex flex-col items-center gap-3 rounded-xl border border-surface-700/40 bg-surface-900/40 p-4 text-center transition-all hover:border-primary-500/30 hover:bg-surface-800/60"
          >
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-surface-200">{label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
