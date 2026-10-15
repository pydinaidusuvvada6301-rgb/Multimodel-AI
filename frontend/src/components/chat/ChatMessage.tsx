import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../../types/index.js';
import { CitationCard } from './CitationCard.js';
import { Copy, Check, Sparkles, User, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { cn } from '../../lib/utils.js';

export const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl transition-all',
        isUser
          ? 'bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 ml-6 sm:ml-16 shadow-[0_0_15px_-3px_rgba(79,140,255,0.15)] text-[#F4F7FF]'
          : 'bg-[#0D1428]/85 border border-[#4F8CFF]/20 shadow-xl mr-4 sm:mr-12 text-[#F4F7FF]'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs',
          isUser
            ? 'bg-[#4F8CFF] text-white shadow-[0_0_12px_rgba(79,140,255,0.5)]'
            : 'bg-[#42E8F5]/15 text-[#42E8F5] border border-[#42E8F5]/30 shadow-[0_0_10px_rgba(66,232,245,0.25)]'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-primary">
              {isUser ? 'You' : 'OmniMind AI'}
            </span>
            {!isUser && message.confidence && (
              <Badge
                variant={message.confidence === 'high' ? 'emerald' : message.confidence === 'medium' ? 'blue' : 'amber'}
                size="sm"
              >
                {message.confidence.toUpperCase()} CONFIDENCE
              </Badge>
            )}
            {!isUser && message.intent && (
              <span className="text-[10px] text-text-secondary font-mono uppercase bg-surface-secondary px-1.5 py-0.5 rounded border border-border-default">
                {message.intent}
              </span>
            )}
          </div>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary transition-colors"
              title="Copy answer"
              aria-label="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Prose Markdown Body */}
        <div className="text-sm text-text-primary leading-relaxed prose prose-neutral max-w-none prose-p:leading-relaxed prose-pre:bg-surface-secondary prose-pre:text-text-primary prose-pre:border prose-pre:border-border-default prose-headings:text-text-primary prose-a:text-brand-600 prose-code:text-brand-700 prose-code:bg-surface-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>

        {/* Citations / Supporting Evidence Chips */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-3 border-t border-border-default mt-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Grounded Evidence Citations ({message.citations.length}):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation, idx) => (
                <CitationCard key={citation.id || idx} citation={citation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

