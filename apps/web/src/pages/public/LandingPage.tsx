import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  Database,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle,
  GitCompare,
  Cpu,
  Layers,
  Lock,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { useAuth } from '../../context/AuthContext.js';

export const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoLaunch = async () => {
    try {
      await demoLogin();
      navigate('/app');
    } catch {
      navigate('/login');
    }
  };

  const modalities = [
    {
      title: 'PDFs & Reports',
      desc: 'Deep text extraction, OCR-style tables, key entities, and executive summaries.',
      icon: FileText,
      color: 'text-cyan-400',
      badge: 'PDF / DOCX',
    },
    {
      title: 'Visuals & Charts',
      desc: 'Multimodal vision analysis for architecture diagrams, charts, and screenshots.',
      icon: ImageIcon,
      color: 'text-purple-400',
      badge: 'PNG / JPG / WEBP',
    },
    {
      title: 'Audio Recordings',
      desc: 'Audio understanding, speaker points, meeting notes, and transcript retrieval.',
      icon: Mic,
      color: 'text-emerald-400',
      badge: 'MP3 / WAV / M4A',
    },
    {
      title: 'Videos & Demos',
      desc: 'Temporal scene breakdown, timestamped moments, and visual demonstration reasoning.',
      icon: Video,
      color: 'text-rose-400',
      badge: 'MP4 / WEBM',
    },
    {
      title: 'Structured Data',
      desc: 'Schema-aware extraction and reasoning across CSV rows and JSON configurations.',
      icon: Database,
      color: 'text-amber-400',
      badge: 'CSV / JSON',
    },
    {
      title: 'Cross-Modal Synthesis',
      desc: 'Unified grounded reasoning that compares information across formats in one prompt.',
      icon: GitCompare,
      color: 'text-indigo-400',
      badge: 'Connected',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-indigo-600/15 to-transparent blur-[120px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <Badge variant="cyan" size="md" className="mx-auto">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Connected Multimodal Intelligence Platform
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-100 tracking-tight leading-[1.1]">
            One Workspace. <br className="hidden sm:inline" />
            Every Modality.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400">
              Connected Intelligence.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop switching between disconnected tools. Upload PDFs, diagrams, audio lectures, and video
            demonstrations into unified workspaces. Ask complex questions and receive evidence-grounded
            answers with verified citations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/register">
              <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Start Free Workspace
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={handleDemoLaunch}
              icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
            >
              Launch Live Demo Account
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Evidence-Grounded Citations
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Private Storage Isolation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Powered by Google Gemini
            </span>
          </div>
        </div>
      </section>

      {/* Cross-Modal Comparison Showcase Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <Card className="bg-gradient-to-br from-surface-300 via-slate-900 to-surface-200 border-slate-700/80 p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center gap-8 justify-between relative z-10">
            <div className="space-y-4 max-w-xl">
              <Badge variant="indigo" size="sm">
                CORE DIFFERENTIATION
              </Badge>
              <h3 className="text-2xl font-bold text-slate-100">
                Ask Questions Across Formats Simultaneously
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                "Compare the deployment architecture in my uploaded PDF with the diagram screenshot
                and the recording steps mentioned at 02:15."
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs bg-slate-800 text-cyan-400 px-3 py-1 rounded-md border border-slate-700 font-mono">
                  #PDF-Spec.pdf
                </span>
                <span className="text-xs bg-slate-800 text-purple-400 px-3 py-1 rounded-md border border-slate-700 font-mono">
                  #Architecture_Diagram.png
                </span>
                <span className="text-xs bg-slate-800 text-emerald-400 px-3 py-1 rounded-md border border-slate-700 font-mono">
                  #Tech_Sync_Audio.m4a
                </span>
              </div>
            </div>

            <div className="w-full lg:w-96 p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs font-mono space-y-2 text-slate-300">
              <div className="flex items-center justify-between text-cyan-400 font-semibold border-b border-slate-800 pb-2">
                <span>OMNIMIND AI SYNTHESIS</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  VERIFIED CITATION
                </span>
              </div>
              <p className="text-slate-300">
                <span className="text-slate-500">Agreements:</span> Both the diagram and document specify pgvector embedding dimensions of 768.
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">Difference:</span> The audio discussion notes that asynchronous workers handle video transcoding, whereas the spec lists synchronous queues.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Modalities Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="cyan" size="sm" className="mx-auto">
            ALL-IN-ONE INGESTION
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">
            Engineered for Every Type of Knowledge
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Native parsing, text chunking, and embedding vectors for each modality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modalities.map((item) => (
            <Card key={item.title} hover className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <Badge variant="default" size="sm">
                  {item.badge}
                </Badge>
              </div>
              <h3 className="text-base font-semibold text-slate-100">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Security & Architecture Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-2.5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h4 className="text-base font-semibold text-slate-100">Evidence Grounding</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every answer resolves citations against verified server-side evidence records.
              Model-hallucinated citation IDs are rejected automatically.
            </p>
          </Card>
          <Card className="space-y-2.5">
            <Lock className="w-6 h-6 text-indigo-400" />
            <h4 className="text-base font-semibold text-slate-100">Zero-Leakage Isolation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict per-user ownership and workspace scoping on all PostgreSQL queries, vector similarity
              searches, and private storage download URLs.
            </p>
          </Card>
          <Card className="space-y-2.5">
            <Cpu className="w-6 h-6 text-emerald-400" />
            <h4 className="text-base font-semibold text-slate-100">Official Google Gemini SDK</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct server-side orchestration with Gemini 2.5 Flash and text-embedding-004.
              No API keys or service role secrets exposed to browser bundles.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-12 px-4 sm:px-8 bg-surface-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">OmniMind AI</span>
            <span>— Connected Multimodal Intelligence</span>
          </div>
          <div>Built with React, Express, Supabase PostgreSQL, and Google Gemini API.</div>
        </div>
      </footer>
    </div>
  );
};
