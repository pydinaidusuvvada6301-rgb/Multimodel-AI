import React from 'react';
import { cn } from '../../lib/utils.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  className,
  label,
  error,
  helperText,
  icon,
  rightElement,
  id,
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#F4F7FF]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-[#9AA8C7] pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-[#070B17]/80 border border-[#4F8CFF]/25 rounded-lg px-3.5 py-2 text-sm text-[#F4F7FF] placeholder:text-[#9AA8C7]/60',
            'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#42E8F5]/25 focus:border-[#42E8F5]',
            icon && 'pl-10',
            rightElement && 'pr-10',
            error && 'border-[#F04438] focus:border-[#F04438] focus:ring-[#F04438]/20',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center text-[#667085]">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#D92D20] mt-1 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#667085] mt-1">{helperText}</p>}
    </div>
  );
};
