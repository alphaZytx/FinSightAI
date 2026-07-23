import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { formatDate, getGreeting } from '../../utils/formatters';
import { Button } from '../Common';
import { useTheme } from '../../context/ThemeContext';

interface WelcomeBannerProps {
  userName?: string;
}

export default function WelcomeBanner({ userName = 'Alex' }: WelcomeBannerProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 ${
        isLight
          ? 'border-primary-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50'
          : 'border-border bg-gradient-to-br from-banner-from via-banner-via to-banner-to'
      }`}
    >
      {/* Decorative blobs — more vivid in light mode */}
      <div className={`absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl ${
        isLight ? 'bg-blue-400/25' : 'bg-primary-500/10'
      }`} />
      <div className={`absolute -bottom-12 -left-12 h-32 w-32 rounded-full blur-2xl ${
        isLight ? 'bg-indigo-400/20' : 'bg-primary-600/10'
      }`} />
      <div className={`absolute right-1/3 top-1/2 h-24 w-24 rounded-full blur-2xl ${
        isLight ? 'bg-violet-300/20' : 'hidden'
      }`} />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`text-sm font-semibold ${isLight ? 'text-primary-600' : 'text-primary-500'}`}>
            {formatDate()}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
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
