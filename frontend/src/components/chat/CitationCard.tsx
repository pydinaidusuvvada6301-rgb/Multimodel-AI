import React, { useState } from 'react';
import { Citation } from '../../types/index.js';
import { FileText, Quote } from 'lucide-react';
import { Modal } from '../ui/Modal.js';

export const CitationCard: React.FC<{ citation: Citation }> = ({ citation }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-secondary hover:bg-brand-50 border border-border-default hover:border-brand-200 text-xs text-text-secondary hover:text-brand-600 transition-colors cursor-pointer group"
        title="View source evidence"
      >
        <FileText className="w-3.5 h-3.5 text-brand-500" />
        <span className="font-medium truncate max-w-[140px] text-text-primary group-hover:text-brand-600">
          {citation.document_name || 'Source'}
        </span>
        {citation.page_number && (
          <span className="text-[11px] text-text-muted">p.{citation.page_number}</span>
        )}
        {citation.start_seconds !== undefined && citation.start_seconds !== null && (
          <span className="text-[11px] text-text-muted">{citation.start_seconds}s</span>
        )}
      </button>

      {/* Detail Popover Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Verified Evidence Reference"
        description={`Grounding evidence verified from ${citation.document_name}`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-xl bg-surface-secondary border border-border-default text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary text-sm">{citation.document_name}</span>
              {citation.relevance_score && (
                <span className="text-brand-600 font-mono font-medium bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                  Relevance: {Math.round(citation.relevance_score * 100)}%
                </span>
              )}
            </div>

            {citation.page_number && (
              <p className="text-text-secondary text-xs">
                <span className="font-medium text-text-primary">Location:</span> Page {citation.page_number}
              </p>
            )}

            {citation.start_seconds !== undefined && (
              <p className="text-text-secondary text-xs">
                <span className="font-medium text-text-primary">Timestamp:</span> {citation.start_seconds}s
                {citation.end_seconds ? ` - ${citation.end_seconds}s` : ''}
              </p>
            )}

            <div className="mt-2 p-3.5 rounded-lg bg-surface-primary border border-border-default shadow-xs">
              <div className="flex items-start gap-2.5">
                <Quote className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <p className="text-text-primary text-xs leading-relaxed italic">
                  "{citation.quoted_text || 'Exact supporting reference preserved in knowledge representation.'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

