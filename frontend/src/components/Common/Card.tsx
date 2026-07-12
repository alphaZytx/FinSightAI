import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div className={`rounded-xl border border-surface-700/60 bg-surface-800/50 backdrop-blur-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-surface-700/40 px-5 py-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-surface-100">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-surface-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={title || action ? 'p-5' : 'p-5'}>{children}</div>
    </div>
  );
}
