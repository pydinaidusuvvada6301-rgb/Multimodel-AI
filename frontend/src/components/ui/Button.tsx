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
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#356AE6] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:translate-y-[0.5px]';

  const variants = {
    primary:
      'bg-[#356AE6] hover:bg-[#2856C5] text-white font-medium shadow-xs',
    secondary:
      'bg-[#F7F9FC] hover:bg-[#EEF2F6] text-[#202938] border border-[#E5EAF1]',
    outline:
      'bg-white hover:bg-[#F7F9FC] text-[#202938] border border-[#E5EAF1] hover:border-[#D0D7E2] shadow-xs',
    ghost:
      'bg-transparent hover:bg-[#F7F9FC] text-[#667085] hover:text-[#202938]',
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
