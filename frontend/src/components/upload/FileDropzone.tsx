import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { cn, formatBytes } from '../../lib/utils.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';

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
  const { toast } = useToast();
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
        toast.error(`File "${file.name}" exceeds the maximum allowed size of 25MB.`);
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
        toast.success(`Successfully uploaded and queued ${stagedFiles.length} file(s) for processing.`);
        setTimeout(() => {
          setStagedFiles([]);
          if (onUploadComplete) onUploadComplete();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const errMsg = err.response?.data?.error?.message || 'Upload failed.';
      toast.error(errMsg);
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
          'border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300',
          isDragOver
            ? 'border-[#42E8F5] bg-[#4F8CFF]/15 scale-[1.01] shadow-lg shadow-[#42E8F5]/10'
            : 'border-[rgba(79,140,255,0.25)] hover:border-[#4F8CFF] bg-[#0D1428]/60 hover:bg-[#0D1428]/90 backdrop-blur-md'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4F8CFF]/20 to-[#42E8F5]/20 border border-[#4F8CFF]/30 text-[#42E8F5] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#4F8CFF]/10">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h4 className="text-base font-semibold font-display text-[#F4F7FF]">
          Drop multimodal documents, images, audio, or video files here
        </h4>
        <p className="text-xs text-[#9AA8C7] mt-1.5 max-w-md mx-auto leading-relaxed">
          Supports PDF, DOCX, TXT, CSV, JSON, PNG, JPG, MP3, WAV, MP4, and WEBM up to 25MB per file.
        </p>
      </div>

      {/* Staged Files Queue */}
      {stagedFiles.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl bg-[#0D1428]/80 border border-[rgba(79,140,255,0.2)] shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F4F7FF]">
              Selected Files ({stagedFiles.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#9AA8C7]">Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#070B17] border border-[rgba(79,140,255,0.25)] rounded-lg px-2.5 py-1 text-xs text-[#F4F7FF] focus:outline-none focus:ring-1 focus:ring-[#4F8CFF] font-medium"
              >
                <option value="general">General</option>
                <option value="research">Research</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
                <option value="engineering">Engineering</option>
              </select>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#070B17]/70 border border-[rgba(79,140,255,0.15)] text-xs"
              >
                <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                  <div className="w-6 h-6 rounded bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 text-[#42E8F5] flex items-center justify-center shrink-0">
                    <File className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[#F4F7FF] font-medium truncate">{item.file.name}</span>
                  <span className="text-[11px] text-[#9AA8C7] shrink-0">
                    ({formatBytes(item.file.size)})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-[#42E8F5] animate-spin" />
                  )}
                  {item.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-400 flex items-center gap-1 text-[11px] font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                  {!isUploading && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1 text-[#9AA8C7] hover:text-[#F4F7FF] rounded transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(79,140,255,0.15)]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStagedFiles([])}
              disabled={isUploading}
              className="border-[rgba(79,140,255,0.25)] text-[#F4F7FF] hover:bg-[#4F8CFF]/15"
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={handleUploadAll}
              loading={isUploading}
              className="bg-gradient-to-r from-[#4F8CFF] to-[#42E8F5] text-[#070B17] font-semibold"
            >
              Upload and Index Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
