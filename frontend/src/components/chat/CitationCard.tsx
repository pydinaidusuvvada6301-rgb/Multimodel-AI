import React, { useState } from 'react';
import { Citation } from '../../types/index.js';
import { FileText, Image, Mic, Video, ExternalLink, Quote } from 'lucide-react';
import { Modal } from '../ui/Modal.js';

export const CitationCard: React.FC<{ citation: Citation }> = ({ citation }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = () => {
    return <FileText className="w-3 h-3 text-cyan-400" />;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer group"
        title="View source evidence"
      >
        {getIcon()}
        <span className="font-medium truncate max-w-[130px]">{citation.document_name || 'Source'}</span>
        {citation.page_number && (
          <span className="text-[10px] text-slate-400">p.{citation.page_number}</span>
        )}
        {citation.start_seconds !== undefined && citation.start_seconds !== null && (
          <span className="text-[10px] text-slate-400">{citation.start_seconds}s</span>
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
        <div className="space-y-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="font-semibold text-slate-200">{citation.document_name}</span>
              {citation.relevance_score && (
                <span className="text-cyan-400 font-mono">
                  Relevance: {Math.round(citation.relevance_score * 100)}%
                </span>
              )}
            </div>

            {citation.page_number && (
              <p className="text-slate-400 text-[11px] mb-1">
                <span className="font-medium text-slate-300">Location:</span> Page {citation.page_number}
              </p>
            )}

            {citation.start_seconds !== undefined && (
              <p className="text-slate-400 text-[11px] mb-1">
                <span className="font-medium text-slate-300">Timestamp:</span> {citation.start_seconds}s
                {citation.end_seconds ? ` - ${citation.end_seconds}s` : ''}
              </p>
            )}

            <div className="mt-2.5 p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <div className="flex items-start gap-2">
                <Quote className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs leading-relaxed italic">
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
