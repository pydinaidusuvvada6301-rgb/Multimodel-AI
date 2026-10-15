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
        subtle ? 'bg-[#070B17]/70' : 'bg-[#0D1428]/75 backdrop-blur-md',
        'rounded-xl p-5 border border-[#4F8CFF]/20 shadow-lg text-[#F4F7FF]',
        hover && 'hover:border-[#42E8F5]/40 hover:shadow-[0_8px_24px_-4px_rgba(66,232,245,0.15)] transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
