import { Link } from 'react-router-dom';
import { Search, FileText, Building2, BarChart3, Upload, GitCompare, MessageSquare, FileOutput, Rocket } from 'lucide-react';
import { formatDate, getGreeting } from '../../utils/formatters';
import { Button } from '../Common';

interface WelcomeBannerProps {
  userName?: string;
}

export default function WelcomeBanner({ userName = 'Alex' }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary-500/20 bg-gradient-to-br from-primary-900/40 via-surface-800/80 to-surface-900/80 p-6 md:p-8">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-primary-600/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-primary-300">{formatDate()}</p>
          <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
            {getGreeting()}, {userName}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-foreground-muted">
            Your financial intelligence workspace is ready. Upload documents, run AI analysis, and generate insights.
          </p>
        </div>

        <Link to="/workspace">
          <Button
            variant="primary"
            size="lg"
            icon={<Rocket className="h-4 w-4" />}
            className="whitespace-nowrap"
          >
            Quick Start
          </Button>
        </Link>
      </div>
    </div>
  );
}

export { Search, FileText, Building2, BarChart3, Upload, GitCompare, MessageSquare, FileOutput };
