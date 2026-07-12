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
  primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20',
  secondary: 'bg-surface-700 hover:bg-surface-600 text-surface-100 border border-surface-600',
  ghost: 'hover:bg-surface-700/50 text-surface-300 hover:text-surface-100',
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
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
