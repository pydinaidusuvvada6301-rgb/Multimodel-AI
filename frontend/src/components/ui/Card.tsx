import React from 'react';
import { cn } from '../../lib/utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: 'cyan' | 'indigo' | 'none';
}

export const Card: React.FC<CardProps> = ({
  className,
  hover = false,
  glow = 'none',
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass-panel rounded-xl p-5 border border-slate-800/80',
        hover && 'glass-panel-hover cursor-pointer',
        glow === 'cyan' && 'glow-cyan',
        glow === 'indigo' && 'glow-indigo',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
