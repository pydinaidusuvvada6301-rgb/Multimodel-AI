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
        subtle ? 'bg-[#F7F9FC]' : 'bg-white',
        'rounded-lg p-5 border border-[#E5EAF1] shadow-xs text-[#202938]',
        hover && 'hover:border-[#D0D7E2] hover:shadow-sm transition-all duration-150 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
