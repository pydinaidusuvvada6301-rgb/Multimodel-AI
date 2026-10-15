import React from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { DocumentItem } from '../../types/index.js';
import { Check, FileText } from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface SourceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleDoc: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const SourceSelectorModal: React.FC<SourceSelectorModalProps> = ({
  isOpen,
  onClose,
  documents,
  selectedDocIds,
  onToggleDoc,
  onSelectAll,
  onClearAll,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Sources for OmniMind AI"
      description="Choose specific documents, images, audio, or video files to ground the AI's answers."
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between text-xs pb-3 border-b border-border-default">
          <span className="text-text-secondary">
            <strong className="text-text-primary font-semibold">{selectedDocIds.length}</strong> of{' '}
            {documents.length} sources selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              Select All
            </button>
            <span className="text-border-default">•</span>
            <button
              onClick={onClearAll}
              className="text-text-muted hover:text-text-primary font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-text-muted py-8 text-center">
            No ready documents in this workspace. Upload files to ground your queries.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => onToggleDoc(doc.id)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-brand-50/70 border-brand-200 text-text-primary'
                      : 'bg-surface-secondary/50 border-border-default text-text-secondary hover:bg-surface-secondary'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-border-default bg-surface-primary'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="font-medium text-text-primary truncate">
                      {doc.original_filename}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-primary border border-border-default text-text-muted">
                    {doc.modality}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-border-default">
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

