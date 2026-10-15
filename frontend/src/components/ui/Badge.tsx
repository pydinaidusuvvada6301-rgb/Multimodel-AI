import React from 'react';
import { cn } from '../../lib/utils.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'blue' | 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-[#F7F9FC] text-[#667085] border-[#E5EAF1]',
    blue: 'bg-[#EEF4FF] text-[#2856C5] border-[#D0D7E2]',
    cyan: 'bg-[#EEF4FF] text-[#2856C5] border-[#D0D7E2]',
    indigo: 'bg-[#EEF4FF] text-[#2856C5] border-[#D0D7E2]',
    emerald: 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]',
    amber: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
    rose: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
