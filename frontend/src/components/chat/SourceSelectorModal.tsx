import React from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { DocumentItem } from '../../types/index.js';
import { Check, FileText, Image, Mic, Video } from 'lucide-react';
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
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
          <span className="text-slate-400">
            {selectedDocIds.length} of {documents.length} sources selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Select All
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={onClearAll}
              className="text-slate-400 hover:text-slate-300 font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No ready documents in this workspace. Upload files to ground your queries.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => onToggleDoc(doc.id)}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-100'
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800/50'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                        isSelected ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-medium truncate">{doc.original_filename}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                    {doc.modality}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
