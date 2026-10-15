import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ModalityType } from '../types/index.js';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getModalityColor(modality: ModalityType): string {
  switch (modality) {
    case 'document':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'image':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'audio':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'video':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    case 'structured':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'text':
    default:
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  }
}

export function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'ready':
      return { label: 'Ready', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    case 'processing':
      return { label: 'Processing', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse' };
    case 'uploading':
      return { label: 'Uploading', className: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 animate-pulse' };
    case 'failed':
      return { label: 'Failed', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
    case 'queued':
    default:
      return { label: 'Queued', className: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
  }
}
