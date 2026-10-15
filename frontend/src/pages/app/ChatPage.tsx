import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Plus,
  Sparkles,
  Loader2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { ChatMessage as ChatMessageType, Conversation, DocumentItem } from '../../types/index.js';
import { ChatMessage } from '../../components/chat/ChatMessage.js';
import { SourceSelectorModal } from '../../components/chat/SourceSelectorModal.js';
import { Button } from '../../components/ui/Button.js';
import { AIVisualization } from '../../components/3d/AIVisualization.js';
import { cn } from '../../lib/utils.js';

export const ChatPage: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get('c');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [detailLevel, setDetailLevel] = useState<'concise' | 'balanced' | 'detailed'>('balanced');
  const [loading, setLoading] = useState(false);
  const [workspaceDocuments, setWorkspaceDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load conversations and workspace documents
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [convsRes, docsRes] = await Promise.all([
          api.get('/conversations', {
            params: activeWorkspace ? { workspaceId: activeWorkspace.id } : {},
          }),
          api.get('/documents', {
            params: activeWorkspace ? { workspaceId: activeWorkspace.id } : {},
          }),
        ]);

        if (convsRes.data.success) {
          setConversations(convsRes.data.data);
        }
        if (docsRes.data.success) {
          const readyDocs = docsRes.data.data.filter((d: DocumentItem) => d.status === 'ready');
          setWorkspaceDocuments(readyDocs);
          // By default, select all ready documents in the workspace
          setSelectedDocIds(readyDocs.map((d: DocumentItem) => d.id));
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
      }
    };

    loadInitialData();
  }, [activeWorkspace]);

  // Load messages when activeConvId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConvId) {
        setMessages([]);
        return;
      }
      try {
        const { data } = await api.get(`/conversations/${activeConvId}/messages`);
        if (data.success && data.data) {
          setMessages(data.data.messages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    loadMessages();
  }, [activeConvId]);

  const handleStartNewChat = () => {
    setSearchParams({});
    setMessages([]);
  };

  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || inputQuestion;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessageType = {
      id: Math.random().toString(),
      conversation_id: activeConvId || 'pending',
      role: 'user',
      content: query.trim(),
      status: 'complete',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        question: query.trim(),
        conversationId: activeConvId || undefined,
        workspaceId: activeWorkspace?.id || undefined,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
        detailLevel,
      });

      if (data.success && data.data) {
        const assistantMsg: ChatMessageType = {
          id: data.data.messageId,
          conversation_id: data.data.conversationId,
          role: 'assistant',
          content: data.data.answer,
          status: 'complete',
          citations: data.data.citations,
          confidence: data.data.confidence,
          keyFindings: data.data.keyFindings,
          intent: data.data.intent,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // If this was a new conversation, set URL parameter and update conversation list
        if (!activeConvId && data.data.conversationId) {
          setSearchParams({ c: data.data.conversationId });
          setConversations((prev) => [
            {
              id: data.data.conversationId,
              user_id: '',
              workspace_id: activeWorkspace?.id || null,
              title: query.slice(0, 40),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg = err.response?.data?.error?.message || 'Failed to process AI response.';
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          conversation_id: activeConvId || '',
          role: 'assistant',
          content: `⚠️ **Error**: ${errMsg}`,
          status: 'error',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sampleQuestions = [
    'Summarize the core technical findings across my uploaded files.',
    'Compare the deployment steps in the document with the diagram.',
    'What key decisions and action items were discussed in the recording?',
    'What information is contradictory or missing across these sources?',
  ];

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 max-w-7xl mx-auto">
      {/* Conversations History Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white rounded-2xl border border-slate-200 p-3 shrink-0 shadow-sm">
        <Button
          size="sm"
          onClick={handleStartNewChat}
          className="w-full mb-3"
          icon={<Plus className="w-4 h-4" />}
        >
          New Chat
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
            History
          </p>
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 px-2 py-4">No chat history yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSearchParams({ c: c.id })}
                className={cn(
                  'w-full text-left p-2.5 rounded-xl text-xs truncate transition-all flex items-center justify-between group cursor-pointer',
                  activeConvId === c.id
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span className="truncate">{c.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Chat Header Context Strip */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Grounded in:</span>
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {selectedDocIds.length === 0
                  ? 'All Workspace Files'
                  : `${selectedDocIds.length} Source(s) Selected`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-medium">Detail:</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                {(['concise', 'balanced', 'detailed'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDetailLevel(lvl)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] capitalize font-medium transition-colors cursor-pointer',
                      detailLevel === lvl
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={handleStartNewChat}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8FAFC]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-4 py-8">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs relative overflow-hidden">
                <AIVisualization isThinking={false} className="w-full h-full" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  OmniMind Connected Intelligence
                </h3>
                <p className="text-xs text-slate-500">
                  Ask any question across your uploaded documents, images, audio transcripts, or video scenes.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="w-full space-y-2 pt-3 text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Suggested inquiries
                </p>
                {sampleQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(undefined, q)}
                    className="w-full p-3 rounded-lg bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 text-xs text-slate-800 text-left transition-colors truncate shadow-xs cursor-pointer font-medium"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}

          {loading && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-white border border-blue-200 mr-12 shadow-xs">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-blue-50 border border-blue-100 shrink-0">
                <AIVisualization isThinking={true} className="w-full h-full" />
              </div>
              <div className="space-y-1 text-left w-full">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-900">
                    Cross-Modal Neural Synthesis Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Searching authorized evidence lattice & verifying factual citations...
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Multiline Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 bg-white">
          <div className="relative flex items-end bg-slate-50 border border-slate-300 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 transition-all shadow-xs">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="Ask a question across your workspace knowledge (Shift+Enter for new line)..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-transparent border-0 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none min-h-[44px] max-h-32"
            />
            <div className="p-2 shrink-0">
              <button
                type="submit"
                disabled={!inputQuestion.trim() || loading}
                className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold shadow-xs cursor-pointer"
                title="Send query"
                aria-label="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Source Selector Modal */}
      <SourceSelectorModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        documents={workspaceDocuments}
        selectedDocIds={selectedDocIds}
        onToggleDoc={(id) => {
          setSelectedDocIds((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
          );
        }}
        onSelectAll={() => setSelectedDocIds(workspaceDocuments.map((d) => d.id))}
        onClearAll={() => setSelectedDocIds([])}
      />
    </div>
  );
};


