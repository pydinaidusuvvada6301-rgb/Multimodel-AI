import React from 'react';
import { cn } from '../../lib/utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  subtle?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hover = false,
  subtle = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        subtle ? 'bg-slate-50 border border-slate-200' : 'bg-white border border-slate-200 shadow-sm',
        'rounded-xl p-5 text-slate-900',
        hover && 'hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

