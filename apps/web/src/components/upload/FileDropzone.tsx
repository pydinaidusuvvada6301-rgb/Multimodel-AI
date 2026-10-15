import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { cn, formatBytes } from '../../lib/utils.js';
import { api } from '../../lib/api.js';

interface FileDropzoneProps {
  workspaceId: string;
  onUploadComplete?: () => void;
}

interface StagedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ workspaceId, onUploadComplete }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [category, setCategory] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: StagedFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the maximum allowed size of 25MB.`);
        return;
      }
      newFiles.push({
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: 'pending',
      });
    });

    setStagedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUploadAll = async () => {
    if (stagedFiles.length === 0 || !workspaceId) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('workspaceId', workspaceId);
    formData.append('category', category);

    stagedFiles.forEach((staged) => {
      formData.append('files', staged.file);
    });

    try {
      setStagedFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'uploading', progress: 50 }))
      );

      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        setStagedFiles((prev) =>
          prev.map((f) => ({ ...f, status: 'completed', progress: 100 }))
        );
        setTimeout(() => {
          setStagedFiles([]);
          if (onUploadComplete) onUploadComplete();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const errMsg = err.response?.data?.error?.message || 'Upload failed.';
      setStagedFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', errorMessage: errMsg }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Target Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200',
          isDragOver
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-900/80'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h4 className="text-sm font-semibold text-slate-100">
          Drop multimodal documents, images, audio, or video files here
        </h4>
        <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
          Supports PDF, DOCX, TXT, CSV, JSON, PNG, JPG, MP3, WAV, MP4, and WEBM up to 25MB per file.
        </p>
      </div>

      {/* Staged Files Queue */}
      {stagedFiles.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">
              Selected Files ({stagedFiles.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="general">General</option>
                <option value="research">Research</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
                <option value="engineering">Engineering</option>
              </select>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                  <File className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-200 font-medium truncate">{item.file.name}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    ({formatBytes(item.file.size)})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  )}
                  {item.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {item.status === 'error' && (
                    <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                  {!isUploading && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStagedFiles([])}
              disabled={isUploading}
            >
              Clear All
            </Button>
            <Button size="sm" onClick={handleUploadAll} loading={isUploading}>
              Upload and Index Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
