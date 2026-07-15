interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const variants = {
  success: 'bg-success text-success-foreground border-success-border',
  warning: 'bg-warning text-warning-foreground border-warning-border',
  error: 'bg-error text-error-foreground border-error-border',
  info: 'bg-info text-info-foreground border-info-border',
  neutral: 'bg-muted text-foreground-muted border-border',
};

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
