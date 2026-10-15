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
          ? 'bg-blue-50/70 border border-blue-200/80 ml-6 sm:ml-16 shadow-xs text-slate-900'
          : 'bg-white border border-slate-200 shadow-sm mr-4 sm:mr-12 text-slate-900'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-900">
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
              <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                {message.intent}
              </span>
            )}
          </div>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy answer"
              aria-label="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Prose Markdown Body */}
        <div className="text-sm text-slate-800 leading-relaxed prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:text-slate-900 prose-pre:border prose-pre:border-slate-200 prose-headings:text-slate-900 prose-a:text-blue-600 prose-code:text-blue-700 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>

        {/* Citations / Supporting Evidence Chips */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-3 border-t border-slate-200 mt-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
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


