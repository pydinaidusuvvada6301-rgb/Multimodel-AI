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
      return 'bg-[#EEF4FF] text-[#2856C5] border-[#D0D7E2]';
    case 'image':
      return 'bg-[#F4F3FF] text-[#5925DC] border-[#D9D6FE]';
    case 'audio':
      return 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]';
    case 'video':
      return 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]';
    case 'structured':
      return 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]';
    case 'text':
    default:
      return 'bg-[#F8F9FC] text-[#344054] border-[#EAECF0]';
  }
}

export function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'ready':
      return { label: 'Ready', className: 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]' };
    case 'processing':
      return { label: 'Processing', className: 'bg-[#EEF4FF] text-[#2856C5] border-[#D0D7E2]' };
    case 'uploading':
      return { label: 'Uploading', className: 'bg-[#EEF4FF] text-[#2856C5] border-[#D0D7E2]' };
    case 'failed':
      return { label: 'Failed', className: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]' };
    case 'queued':
    default:
      return { label: 'Queued', className: 'bg-[#F8F9FC] text-[#667085] border-[#E5EAF1]' };
  }
}
