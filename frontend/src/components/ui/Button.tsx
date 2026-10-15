import React from 'react';
import { cn } from '../../lib/utils.js';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:translate-y-[0.5px]';

  const variants = {
    primary:
      'bg-[#4F8CFF] hover:bg-[#3A77ED] text-white font-medium shadow-[0_0_20px_-3px_rgba(79,140,255,0.4)] hover:shadow-[0_0_24px_-2px_rgba(66,232,245,0.5)]',
    secondary:
      'bg-[#0D1428] hover:bg-[#131D3A] text-[#F4F7FF] border border-[#4F8CFF]/25 hover:border-[#42E8F5]/40 shadow-xs',
    outline:
      'bg-[#070B17]/60 hover:bg-[#4F8CFF]/15 text-[#F4F7FF] border border-[#4F8CFF]/30 hover:border-[#42E8F5]/50 shadow-xs',
    ghost:
      'bg-transparent hover:bg-[#4F8CFF]/10 text-[#9AA8C7] hover:text-[#F4F7FF]',
    danger:
      'bg-[#F04438] hover:bg-[#D92D20] text-white shadow-xs',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 font-medium',
    md: 'text-sm px-3.5 py-2 gap-2 font-medium',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-medium',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : icon}
      {children}
    </button>
  );
};
