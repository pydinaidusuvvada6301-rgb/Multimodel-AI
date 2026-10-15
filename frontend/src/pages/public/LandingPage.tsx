import React, { useRef } from 'react';
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
  Lock,
  Layers,
  Compass,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { useAuth } from '../../context/AuthContext.js';
import { InteractiveGlobe, GlobeController } from '../../components/3d/InteractiveGlobe.js';

export const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const globeRef = useRef<GlobeController>(null);

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
      desc: 'Deep text extraction, OCR-style tables, key entities, and executive summaries with page citations.',
      icon: FileText,
      badge: 'PDF / DOCX',
      tagColor: 'blue',
    },
    {
      title: 'Visuals & Charts',
      desc: 'Multimodal vision analysis for architecture diagrams, charts, graphs, and system flowcharts.',
      icon: ImageIcon,
      badge: 'PNG / JPG / WEBP',
      tagColor: 'cyan',
    },
    {
      title: 'Audio Recordings',
      desc: 'Speaker-aware understanding, meeting action items, transcript extraction, and voice search.',
      icon: Mic,
      badge: 'MP3 / WAV / M4A',
      tagColor: 'emerald',
    },
    {
      title: 'Videos & Demos',
      desc: 'Temporal scene breakdown, timestamped moments, and visual demonstration reasoning.',
      icon: Video,
      badge: 'MP4 / WEBM',
      tagColor: 'indigo',
    },
    {
      title: 'Structured Data',
      desc: 'Schema-aware tabular extraction and reasoning across CSV rows, JSON configs, and tables.',
      icon: Database,
      badge: 'CSV / JSON',
      tagColor: 'amber',
    },
    {
      title: 'Cross-Modal Synthesis',
      desc: 'Unified grounded reasoning that compares information across formats in one comprehensive prompt.',
      icon: GitCompare,
      badge: 'Synthesized',
      tagColor: 'rose',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900">
      <PublicNavbar />

      {/* Hero Section with Interactive 3D Multimodal Globe */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Clean Intelligence • Multimodal AI Workspace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              One Workspace. <br />
              Every Modality.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                Grounded Truth.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Ingest PDFs, architectural diagrams, audio recordings, and video demonstrations into
              unified, user-isolated workspaces. Ask complex cross-source questions and receive verified,
              evidence-grounded answers with real citations.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/register">
                <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                  Start Free Workspace
                </Button>
              </Link>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleDemoLaunch}
                icon={<Sparkles className="w-4 h-4 text-cyan-600" />}
              >
                Launch Live Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Evidence-Grounded Citations
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Zero-Leakage Supabase Isolation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Google Gemini 2.5 Flash SDK
              </span>
            </div>
          </div>

          {/* Right Hero: Real Interactive 3D Globe Card */}
          <div className="lg:col-span-5 w-full">
            <div className="relative rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 tracking-tight">Interactive Knowledge Topology</span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Three.js WebGL
                </span>
              </div>

              {/* 3D Globe with native interactive controls */}
              <div className="w-full h-80 sm:h-96 rounded-xl bg-slate-900/5 relative overflow-hidden">
                <InteractiveGlobe
                  ref={globeRef}
                  showControls={true}
                  className="w-full h-full"
                />
              </div>

              <div className="pt-3 px-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  Auto-rotation & manual drag active
                </span>
                <span className="font-semibold text-blue-600">OmniMind Core</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Modal Synthesis Showcase */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 justify-between">
            <div className="space-y-3 max-w-xl">
              <span className="text-[11px] font-bold tracking-wider text-cyan-700 uppercase bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded">
                Cross-Modal Synthesis
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Ask Questions Across Formats Simultaneously
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Query across multiple active sources in a single prompt. OmniMind AI analyzes documents,
                visuals, and recordings together, resolving corroborating evidence and highlighting discrepancies.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                  #Technical-Spec.pdf
                </span>
                <span className="text-xs bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                  #System_Architecture.png
                </span>
                <span className="text-xs bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                  #Design_Review.m4a
                </span>
              </div>
            </div>

            <div className="w-full lg:w-96 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2 text-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-blue-700 font-semibold border-b border-slate-200 pb-2">
                <span>OMNIMIND AI SYNTHESIS</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-sans font-semibold">
                  VERIFIED CITATION
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                <span className="text-blue-700 font-semibold">Agreements:</span> Both the diagram and document specify vector embedding dimensions of 768.
              </p>
              <p className="text-slate-700 leading-relaxed">
                <span className="text-slate-500 font-semibold">Discrepancy:</span> The audio recording notes asynchronous queuing for video transcoding, while the spec describes synchronous pipelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Production Workflow */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">
            Product Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            From Raw Modality to Grounded Answer
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            A transparent four-stage pipeline engineered to prevent hallucination.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-sm">
            <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              01
            </span>
            <h3 className="text-sm font-bold text-slate-900">Upload & Ingest</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload supported PDFs, images, audio, or video files with validated MIME types and metadata inspection.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-sm">
            <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              02
            </span>
            <h3 className="text-sm font-bold text-slate-900">Extract & Embed</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deep OCR, vision analysis, audio transcription, and semantic vector chunking via Gemini models.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-sm">
            <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              03
            </span>
            <h3 className="text-sm font-bold text-slate-900">Hybrid Retrieval</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Retrieve relevant passages across active workspace sources using vector cosine similarity and full-text keyword matching.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-sm">
            <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              04
            </span>
            <h3 className="text-sm font-bold text-slate-900">Verify Citations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Model answers are grounded in returned evidence chunks. Every citation links to verifiable source text and page numbers.
            </p>
          </div>
        </div>
      </section>

      {/* Modalities Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-200">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
            Supported Modalities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Engineered for Every Type of Knowledge
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Native parsing, semantic extraction, and citation tracking across data formats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modalities.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl p-5 space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <item.icon className="w-4 h-4" />
                </div>
                <Badge variant={item.tagColor as any} size="sm">
                  {item.badge}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Reliability Pillars */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Evidence Grounding</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every answer resolves citations against verified server-side evidence records.
              Model-hallucinated citation IDs are filtered out automatically.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Zero-Leakage Isolation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict per-user ownership and workspace scoping on all database queries, vector similarity
              searches, and document assets.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Google Gemini 2.5 Flash</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct server-side orchestration with Gemini 2.5 Flash and text-embedding-004.
              No API keys or service role secrets are ever exposed to the client.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-8 px-4 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px]">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-bold text-slate-900">OmniMind AI</span>
            <span>— Clean Intelligence Workspace</span>
          </div>
          <div className="text-center sm:text-right">
            Engineered with React, TypeScript, Supabase PostgreSQL, and Google Gemini API.
          </div>
        </div>
      </footer>
    </div>
  );
};

