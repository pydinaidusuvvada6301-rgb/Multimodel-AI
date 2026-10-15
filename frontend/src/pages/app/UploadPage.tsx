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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#42E8F5] flex items-center justify-center text-white shadow-lg shadow-[#4F8CFF]/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[#F4F7FF] tracking-tight">
              Multimodal Ingestion Center
            </h1>
            <p className="text-xs sm:text-sm text-[#9AA8C7] mt-0.5">
              Upload documents, images, audio recordings, or videos for parsing, vector indexing, and AI synthesis.
            </p>
          </div>
        </div>
      </div>

      {/* Target Workspace Selector */}
      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[rgba(79,140,255,0.2)] bg-[#0D1428]/80 backdrop-blur-md">
        <div>
          <span className="text-xs font-semibold text-[#42E8F5] uppercase tracking-wider">
            Target Workspace
          </span>
          <p className="text-xs text-[#9AA8C7] mt-0.5">
            All uploaded files will be securely indexed into this collection
          </p>
        </div>

        <select
          value={activeWorkspace?.id || ''}
          onChange={(e) => {
            const found = workspaces.find((w) => w.id === e.target.value);
            if (found) setActiveWorkspace(found);
          }}
          className="bg-[#070B17] border border-[rgba(79,140,255,0.25)] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#F4F7FF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/30 focus:border-[#4F8CFF] font-medium transition-colors"
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
        <div className="glass-card p-8 text-center text-[#9AA8C7] text-xs rounded-xl border border-[rgba(79,140,255,0.2)] bg-[#0D1428]/80">
          Please select or create a workspace first.
        </div>
      )}

      {/* Ingestion Pipeline Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="glass-card p-4 space-y-2.5 text-xs rounded-xl border border-[rgba(79,140,255,0.18)] bg-[#0D1428]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[#42E8F5] font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-[#F4F7FF]">1. Parsing & Extraction</span>
          </div>
          <p className="text-[#9AA8C7] leading-relaxed">
            Extracts clean text from PDFs and DOCX, metadata from images, and transcripts from audio and video recordings.
          </p>
        </div>

        <div className="glass-card p-4 space-y-2.5 text-xs rounded-xl border border-[rgba(79,140,255,0.18)] bg-[#0D1428]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[#4F8CFF] font-semibold">
            <Cpu className="w-4 h-4 shrink-0" />
            <span className="text-[#F4F7FF]">2. Chunking & Embeddings</span>
          </div>
          <p className="text-[#9AA8C7] leading-relaxed">
            Splits content into bounded chunks with overlap, generating 768-dim embeddings via Google Gemini text-embedding-004.
          </p>
        </div>

        <div className="glass-card p-4 space-y-2.5 text-xs rounded-xl border border-[rgba(79,140,255,0.18)] bg-[#0D1428]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-[#F4F7FF]">3. Grounded Retrieval</span>
          </div>
          <p className="text-[#9AA8C7] leading-relaxed">
            Ensures that every fact and quotation cited during cross-modal reasoning is anchored to user-authorized source evidence.
          </p>
        </div>
      </div>
    </div>
  );
};

