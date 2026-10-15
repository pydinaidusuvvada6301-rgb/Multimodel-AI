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
} from 'lucide-react';
import { api } from '../../lib/api.js';

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
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs shadow-lg shadow-brand-600/25 hover:shadow-xl transition-all duration-200 border border-brand-500 cursor-pointer"
          aria-label="Open OmniMind Guide"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <span className="font-semibold tracking-wide">OmniMind Guide</span>
        </button>
      )}

      {/* Slide-over / Pop-out Customer Guidance Chatbot Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[440px] max-w-[calc(100vw-2rem)] h-[640px] max-h-[88vh] flex flex-col rounded-2xl bg-surface-primary border border-border-default shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 px-4 bg-surface-primary border-b border-border-default flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  OmniMind Guide
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
                    Copilot
                  </span>
                </h3>
                <p className="text-[11px] text-text-muted">Contextual workspace guidance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Guide Me Toggle */}
              <button
                type="button"
                onClick={() => setGuideMode(!guideMode)}
                title="Toggle Step-by-Step Guidance"
                className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                  guideMode
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'bg-surface-secondary text-text-muted'
                }`}
              >
                Guide: {guideMode ? 'ON' : 'OFF'}
              </button>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear Chat History"
                  className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                aria-label="Close Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-secondary/30">
            {messages.length === 0 ? (
              <div className="space-y-4">
                {/* Welcome Card */}
                <div className="p-4 rounded-xl bg-surface-primary border border-border-default shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-text-primary font-semibold">Welcome to OmniMind AI</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    "Hi! I'm your OmniMind Guide. Tell me what you're trying to do, and I'll help you
                    choose the right tools. You don't need to know technical terms."
                  </p>
                </div>

                {/* 9 Clickable Suggestions */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-1">
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
                          className="w-full text-left p-3 rounded-xl bg-surface-primary hover:bg-brand-50/50 border border-border-default hover:border-brand-200 transition-all flex items-start gap-3 group shadow-xs cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-text-primary group-hover:text-brand-600 flex items-center justify-between">
                              <span>{sug.title}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-600 group-hover:translate-x-0.5 transition-transform" />
                            </p>
                            <p className="text-[11px] text-text-secondary truncate mt-0.5">
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
                    className={`max-w-[88%] p-3.5 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white rounded-br-none shadow-xs'
                        : 'bg-surface-primary border border-border-default text-text-primary rounded-bl-none shadow-xs space-y-2.5'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Step Guide Tracker */}
                    {msg.stepGuide && (
                      <div className="p-2 rounded-lg bg-brand-50 border border-brand-100 text-[11px] flex items-center justify-between text-brand-700">
                        <span className="font-semibold">
                          Step {msg.stepGuide.currentStep} of {msg.stepGuide.totalSteps}:{' '}
                          {msg.stepGuide.stepTitle}
                        </span>
                        {msg.stepGuide.actionId && (
                          <button
                            type="button"
                            onClick={() => executeAction(msg.stepGuide!.actionId!)}
                            className="underline hover:text-brand-900 font-medium"
                          >
                            Execute Step →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Grounded Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-border-default space-y-1 text-[11px]">
                        <p className="text-[10px] uppercase font-semibold text-brand-600 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Grounded Evidence Citations
                        </p>
                        {msg.citations.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded bg-surface-secondary border border-border-default text-text-primary flex items-center justify-between"
                          >
                            <span className="truncate max-w-[200px] text-[10px] font-medium">
                              {c.document_name || 'Document'}
                            </span>
                            <span className="text-[10px] text-brand-600 font-mono font-medium">
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
                      <div className="pt-2 border-t border-border-default flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act) => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => executeAction(act.id)}
                            className="px-2.5 py-1 rounded-md bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
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
                        className="p-1 text-text-muted hover:text-text-primary text-[10px] flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
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
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-primary border border-border-default text-xs text-text-secondary max-w-[75%] shadow-xs">
                <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                <span>OmniMind Guide is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-surface-primary border-t border-border-default">
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
                className="flex-1 bg-surface-secondary border border-border-default focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-xs text-text-primary rounded-xl px-3.5 py-2.5 placeholder:text-text-muted transition-colors outline-none"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold transition-all cursor-pointer shadow-xs"
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

