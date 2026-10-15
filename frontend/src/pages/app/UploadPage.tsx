import React from 'react';
import { UploadCloud, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { FileDropzone } from '../../components/upload/FileDropzone.js';
import { Card } from '../../components/ui/Card.js';

export const UploadPage: React.FC = () => {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-cyan-400" />
          Multimodal Ingestion Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload documents, images, audio recordings, or videos for parsing, vector indexing, and AI synthesis.
        </p>
      </div>

      {/* Target Workspace Picker */}
      <Card className="p-4 bg-surface-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-200">Target Workspace:</span>
          <p className="text-[11px] text-slate-400">All uploaded media will be indexed into this collection</p>
        </div>

        <select
          value={activeWorkspace?.id || ''}
          onChange={(e) => {
            const found = workspaces.find((w) => w.id === e.target.value);
            if (found) setActiveWorkspace(found);
          }}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
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
        <Card className="p-8 text-center text-slate-400 text-xs">
          Please select or create a workspace first.
        </Card>
      )}

      {/* Ingestion Pipeline Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Card className="p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>1. Parsing & Extraction</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Extracts clean text from PDFs and DOCX, metadata from images, and transcripts from audio and video recordings.
          </p>
        </Card>

        <Card className="p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold">
            <Cpu className="w-4 h-4" />
            <span>2. Chunking & Embeddings</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Splits content into bounded chunks with overlap, generating 768-dim embeddings via Google Gemini text-embedding-004.
          </p>
        </Card>

        <Card className="p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>3. Grounded Retrieval</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Ensures that every fact and quotation cited during cross-modal reasoning is anchored to user-authorized source evidence.
          </p>
        </Card>
      </div>
    </div>
  );
};
