import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  FileText,
  FileQuestion,
  Image,
  Mic,
  Video,
  GitCompare,
  Search,
  HelpCircle,
  Compass,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: Array<{ id: string; label: string; payload?: any }>;
  citations?: Array<{
    document_name?: string;
    page_number?: number;
    start_seconds?: number;
    claim?: string;
    supporting_quote?: string;
  }>;
  stepGuide?: {
    currentStep: number;
    totalSteps: number;
    stepTitle: string;
    actionId?: string;
  };
}

const ONBOARDING_SUGGESTIONS = [
  {
    id: 'summarize_pdf',
    icon: FileText,
    title: 'Summarize a PDF',
    action: 'summarize_sources',
    description: 'Get key takeaways, executive summaries, or study notes',
  },
  {
    id: 'ask_docs',
    icon: FileQuestion,
    title: 'Ask questions about my documents',
    action: 'ask_about_sources',
    description: 'Find answers with verifiable page-number citations',
  },
  {
    id: 'analyze_image',
    icon: Image,
    title: 'Analyze an image',
    action: 'open_upload',
    description: 'Inspect diagrams, photos, charts, and OCR text',
  },
  {
    id: 'understand_audio',
    icon: Mic,
    title: 'Understand an audio recording',
    action: 'open_upload',
    description: 'Transcribe podcasts, voice notes, and interviews',
  },
  {
    id: 'analyze_video',
    icon: Video,
    title: 'Analyze a video',
    action: 'open_upload',
    description: 'Extract insights and scene transcript timestamps',
  },
  {
    id: 'compare_files',
    icon: GitCompare,
    title: 'Compare multiple files',
    action: 'compare_sources',
    description: 'Highlight agreements, contradictions, and data gaps',
  },
  {
    id: 'find_info',
    icon: Search,
    title: 'Find information across my sources',
    action: 'select_sources',
    description: 'Semantic vector retrieval across all uploaded modalities',
  },
  {
    id: 'explain_app',
    icon: HelpCircle,
    title: 'Explain how this application works',
    action: 'show_supported_formats',
    description: 'A 3-step beginner guide to OmniMind intelligence',
  },
  {
    id: 'choose_start',
    icon: Compass,
    title: 'Help me choose where to start',
    action: 'open_upload',
    description: 'Personalized recommendation based on your goals',
  },
];

export const OmniMindGuide: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [guideMode, setGuideMode] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text?: string, actionName?: string) => {
    const messageToSend = text || inputValue.trim();
    if (!messageToSend && !actionName) return;

    if (messageToSend) {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: messageToSend,
        },
      ]);
      setInputValue('');
    }

    setLoading(true);

    try {
      const { data } = await api.post('/assistant/chat', {
        message: messageToSend || undefined,
        action: actionName || undefined,
        conversationId,
        isGuideMode: guideMode,
      });

      if (data.success && data.data) {
        if (!conversationId && data.data.conversationId) {
          setConversationId(data.data.conversationId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: data.data.messageId || `asst-${Date.now()}`,
            role: 'assistant',
            content: data.data.reply,
            suggestedActions: data.data.suggestedActions,
            citations: data.data.citations,
            stepGuide: data.data.stepGuide,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            err.response?.data?.error?.message ||
            'I encountered a temporary connection issue. Please click retry or ask again.',
          suggestedActions: [{ id: 'open_upload', label: 'Try Uploading a File' }],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (actionId: string) => {
    switch (actionId) {
      case 'open_upload':
        navigate('/app/upload');
        break;
      case 'select_sources':
      case 'check_processing_status':
        navigate('/app/library');
        break;
      case 'open_settings':
        navigate('/app/settings');
        break;
      case 'compare_sources':
        navigate('/app/reports');
        break;
      case 'summarize_sources':
      case 'ask_about_sources':
        navigate('/app/chat');
        break;
      default:
        handleSendMessage(undefined, actionId);
        break;
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(undefined);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white font-medium text-xs shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
          aria-label="Open OmniMind Guide"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <span className="font-semibold tracking-wide">OmniMind Guide</span>
        </button>
      )}

      {/* Slide-over / Pop-out Customer Guidance Chatbot Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[440px] max-w-[calc(100vw-2rem)] h-[640px] max-h-[88vh] flex flex-col rounded-2xl bg-surface-200/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  OmniMind Guide
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    AI Assistant
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Contextual multimodal copilot</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Guide Me Toggle */}
              <button
                type="button"
                onClick={() => setGuideMode(!guideMode)}
                title="Toggle Step-by-Step Guidance"
                className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors ${
                  guideMode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Guide Me: {guideMode ? 'ON' : 'OFF'}
              </button>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear Chat History"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                aria-label="Close Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                {/* Welcome Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Welcome to OmniMind AI!</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    "Hi! I'm your OmniMind Guide. Tell me what you're trying to do, and I'll help you
                    choose the right tools. You don't need to know technical terms."
                  </p>
                </div>

                {/* 9 Clickable Suggestions */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    What would you like to do?
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {ONBOARDING_SUGGESTIONS.map((sug) => {
                      const Icon = sug.icon;
                      return (
                        <button
                          key={sug.id}
                          onClick={() => {
                            handleSendMessage(sug.title, sug.action);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-start gap-2.5 group"
                        >
                          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 group-hover:text-cyan-300 shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                              <span>{sug.title}</span>
                              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {sug.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  } space-y-1`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm space-y-2.5'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Step Guide Tracker */}
                    {msg.stepGuide && (
                      <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] flex items-center justify-between text-cyan-300">
                        <span className="font-semibold">
                          Step {msg.stepGuide.currentStep} of {msg.stepGuide.totalSteps}:{' '}
                          {msg.stepGuide.stepTitle}
                        </span>
                        {msg.stepGuide.actionId && (
                          <button
                            type="button"
                            onClick={() => executeAction(msg.stepGuide!.actionId!)}
                            className="underline hover:text-white font-medium"
                          >
                            Execute Step →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Grounded Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
                        <p className="text-[10px] uppercase font-semibold text-cyan-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Grounded Evidence Citations
                        </p>
                        {msg.citations.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between"
                          >
                            <span className="truncate max-w-[200px] text-[10px]">
                              {c.document_name || 'Document'}
                            </span>
                            <span className="text-[10px] text-cyan-300 font-mono">
                              {c.page_number
                                ? `Page ${c.page_number}`
                                : c.start_seconds
                                ? `${c.start_seconds}s`
                                : 'Verified'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actionable buttons */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act) => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => executeAction(act.id)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1"
                          >
                            <span>{act.label}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 px-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 text-slate-500 hover:text-slate-300 text-[10px] flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-[70%]">
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>OmniMind Guide is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask how to do something or what to choose..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 rounded-xl px-3 py-2.5 placeholder-slate-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-transform active:scale-95"
                aria-label="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
