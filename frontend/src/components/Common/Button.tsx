import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

const variants = {
  primary: 'bg-gradient-to-b from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-primary-foreground shadow-primary border border-primary-700/50 focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
  secondary: 'bg-muted hover:bg-muted-hover text-foreground border border-border focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
  ghost: 'hover:bg-muted-hover text-foreground-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary-500/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  icon,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
