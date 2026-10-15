import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquareCode,
  Send,
  Plus,
  Filter,
  Sparkles,
  ShieldCheck,
  Trash2,
  SlidersHorizontal,
  Loader2,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { ChatMessage as ChatMessageType, Conversation, DocumentItem } from '../../types/index.js';
import { ChatMessage } from '../../components/chat/ChatMessage.js';
import { SourceSelectorModal } from '../../components/chat/SourceSelectorModal.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

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

  const sampleQuestions = [
    'Summarize the core technical findings across my uploaded files.',
    'Compare the deployment steps in the document with the diagram.',
    'What key decisions and action items were discussed in the recording?',
    'What information is contradictory or missing across these sources?',
  ];

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 max-w-7xl mx-auto">
      {/* Conversations History Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-surface-200/90 rounded-2xl border border-slate-800 p-3 shrink-0">
        <Button
          size="sm"
          onClick={handleStartNewChat}
          className="w-full mb-3"
          icon={<Plus className="w-4 h-4" />}
        >
          New Chat
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1">
            History
          </p>
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-500 px-2 py-4">No chat history yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSearchParams({ c: c.id })}
                className={`w-full text-left p-2.5 rounded-lg text-xs truncate transition-colors flex items-center justify-between group ${
                  activeConvId === c.id
                    ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="truncate">{c.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-surface-200/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Chat Header Context Strip */}
        <div className="p-3 border-b border-slate-800/80 bg-surface-300/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Grounded in:</span>
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                {selectedDocIds.length === 0
                  ? 'All Workspace Files'
                  : `${selectedDocIds.length} Source(s) Selected`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Detail:</span>
            <div className="flex bg-slate-900 rounded p-0.5 border border-slate-700">
              {(['concise', 'balanced', 'detailed'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDetailLevel(lvl)}
                  className={`px-2 py-0.5 rounded text-[10px] capitalize font-medium ${
                    detailLevel === lvl
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/20">
                <Sparkles className="w-6 h-6 font-bold" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">
                  OmniMind Connected Intelligence
                </h3>
                <p className="text-xs text-slate-400">
                  Ask any question across your uploaded documents, images, audio transcripts, or video scenes.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="w-full space-y-2 pt-2 text-left">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
                  Suggested inquiries
                </p>
                {sampleQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(undefined, q)}
                    className="w-full p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 text-left transition-colors truncate"
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-200/90 border border-slate-800 mr-12 animate-pulse">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">
                Searching authorized evidence & synthesizing grounded answer...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-800 bg-surface-300/40">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask a question across your workspace knowledge..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || loading}
              className="absolute right-2 p-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
            >
              <Send className="w-4 h-4" />
            </button>
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
