import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#070B17]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full rounded-2xl bg-[#0D1428]/95 backdrop-blur-xl border border-[#4F8CFF]/25 p-6 shadow-2xl',
          'z-10 overflow-hidden transform transition-all text-[#F4F7FF]',
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 id="modal-title" className="text-base font-semibold text-[#F4F7FF]">
                {title}
              </h3>
            )}
            {description && <p className="text-xs text-[#9AA8C7] mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#9AA8C7] hover:text-[#F4F7FF] rounded-lg hover:bg-[#4F8CFF]/15 transition-colors focus:outline-none focus:ring-2 focus:ring-[#42E8F5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
