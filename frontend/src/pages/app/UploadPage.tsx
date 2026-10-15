import React from 'react';
import { UploadCloud, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { FileDropzone } from '../../components/upload/FileDropzone.js';
import { Card } from '../../components/ui/Card.js';

export const UploadPage: React.FC = () => {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
              Multimodal Ingestion Center
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Upload documents, images, audio recordings, or videos for parsing, vector indexing, and AI synthesis.
            </p>
          </div>
        </div>
      </div>

      {/* Target Workspace Selector */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Target Workspace
          </span>
          <p className="text-xs text-text-secondary mt-0.5">
            All uploaded files will be securely indexed into this collection
          </p>
        </div>

        <select
          value={activeWorkspace?.id || ''}
          onChange={(e) => {
            const found = workspaces.find((w) => w.id === e.target.value);
            if (found) setActiveWorkspace(found);
          }}
          className="bg-surface-secondary border border-border-default rounded-lg px-3 py-2 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium transition-colors"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} ({ws.category})
            </option>
          ))}
        </select>
      </Card>

      {/* Upload Dropzone */}
      {activeWorkspace ? (
        <FileDropzone workspaceId={activeWorkspace.id} />
      ) : (
        <Card className="p-8 text-center text-text-muted text-xs">
          Please select or create a workspace first.
        </Card>
      )}

      {/* Ingestion Pipeline Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Card className="p-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-brand-600 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-text-primary">1. Parsing & Extraction</span>
          </div>
          <p className="text-text-secondary leading-relaxed">
            Extracts clean text from PDFs and DOCX, metadata from images, and transcripts from audio and video recordings.
          </p>
        </Card>

        <Card className="p-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-brand-600 font-semibold">
            <Cpu className="w-4 h-4 shrink-0" />
            <span className="text-text-primary">2. Chunking & Embeddings</span>
          </div>
          <p className="text-text-secondary leading-relaxed">
            Splits content into bounded chunks with overlap, generating 768-dim embeddings via Google Gemini text-embedding-004.
          </p>
        </Card>

        <Card className="p-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-text-primary">3. Grounded Retrieval</span>
          </div>
          <p className="text-text-secondary leading-relaxed">
            Ensures that every fact and quotation cited during cross-modal reasoning is anchored to user-authorized source evidence.
          </p>
        </Card>
      </div>
    </div>
  );
};

