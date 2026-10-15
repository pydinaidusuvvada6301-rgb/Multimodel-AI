import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../../types/index.js';
import { CitationCard } from './CitationCard.js';
import { Copy, Check, Sparkles, User, ShieldCheck, AlertCircle } from 'lucide-react';
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
        'flex gap-3.5 p-4 rounded-xl transition-colors',
        isUser
          ? 'bg-slate-900/40 border border-slate-800/60 ml-8 sm:ml-16'
          : 'bg-surface-200/90 border border-slate-800 mr-4 sm:mr-12'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-md',
          isUser
            ? 'bg-slate-800 text-slate-300 border border-slate-700'
            : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-slate-950 shadow-cyan-500/20'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 font-bold" />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              {isUser ? 'You' : 'OmniMind AI'}
            </span>
            {!isUser && message.confidence && (
              <Badge
                variant={message.confidence === 'high' ? 'emerald' : message.confidence === 'medium' ? 'cyan' : 'amber'}
                size="sm"
              >
                {message.confidence.toUpperCase()} CONFIDENCE
              </Badge>
            )}
            {!isUser && message.intent && (
              <span className="text-[10px] text-slate-400 font-mono uppercase bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                {message.intent}
              </span>
            )}
          </div>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Prose Markdown Body */}
        <div className="text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>

        {/* Citations / Supporting Evidence Chips */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 mt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded Evidence Citations ({message.citations.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
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
