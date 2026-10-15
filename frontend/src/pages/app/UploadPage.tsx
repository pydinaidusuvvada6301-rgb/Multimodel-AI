import React from 'react';
import { UploadCloud, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { FileDropzone } from '../../components/upload/FileDropzone.js';

export const UploadPage: React.FC = () => {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Multimodal Ingestion Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Upload documents, images, audio recordings, or videos for parsing, vector indexing, and AI synthesis.
            </p>
          </div>
        </div>
      </div>

      {/* Target Workspace Selector */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Target Workspace
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            All uploaded files will be securely indexed into this collection
          </p>
        </div>

        <select
          value={activeWorkspace?.id || ''}
          onChange={(e) => {
            const found = workspaces.find((w) => w.id === e.target.value);
            if (found) setActiveWorkspace(found);
          }}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium transition-colors cursor-pointer"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} ({ws.category})
            </option>
          ))}
        </select>
      </div>

      {/* Upload Dropzone */}
      {activeWorkspace ? (
        <FileDropzone workspaceId={activeWorkspace.id} />
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-slate-200 bg-white shadow-sm">
          Please select or create a workspace first.
        </div>
      )}

      {/* Ingestion Pipeline Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 space-y-2.5 text-xs rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-blue-700 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
            <span className="text-slate-900">1. Parsing & Extraction</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Extracts clean text from PDFs and DOCX, metadata from images, and transcripts from audio and video recordings.
          </p>
        </div>

        <div className="p-4 space-y-2.5 text-xs rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-cyan-700 font-bold">
            <Cpu className="w-4 h-4 shrink-0 text-cyan-600" />
            <span className="text-slate-900">2. Chunking & Embeddings</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Splits content into bounded chunks with overlap, generating 768-dim embeddings via Google Gemini text-embedding-004.
          </p>
        </div>

        <div className="p-4 space-y-2.5 text-xs rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="text-slate-900">3. Grounded Retrieval</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Ensures that every fact and quotation cited during cross-modal reasoning is anchored to user-authorized source evidence.
          </p>
        </div>
      </div>
    </div>
  );
};


