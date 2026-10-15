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
import { Floating3DObjects } from '../../components/3d/Floating3DObjects.js';

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
    <div className="min-h-screen bg-[#070B17] flex flex-col text-[#F4F7FF]">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <Badge variant="cyan" size="md" className="mx-auto">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#42E8F5]" />
            3D Multimodal Intelligence Workspace
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F4F7FF] tracking-tight leading-[1.15]">
            One Workspace. <br className="hidden sm:inline" />
            Every Modality.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#42E8F5]">
              Connected Intelligence.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#9AA8C7] max-w-2xl mx-auto leading-relaxed">
            Ingest PDFs, architectural diagrams, audio recordings, and video demonstrations into
            unified workspaces. Ask complex cross-source questions and receive verified,
            evidence-grounded answers with precise citations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/register">
              <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Start Free Workspace
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={handleDemoLaunch}
              icon={<Sparkles className="w-4 h-4 text-[#42E8F5]" />}
            >
              Launch Live Demo Account
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#9AA8C7] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#12B76A]" />
              Evidence-Grounded Citations
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#12B76A]" />
              Private Storage Isolation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#12B76A]" />
              Google Gemini 2.5 Flash SDK
            </span>
          </div>
        </div>
      </section>

      {/* 3D Interactive Multimodal Architecture Showcase */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#0D1428]/90 via-[#070B17]/95 to-[#0D1428]/90 border border-[#4F8CFF]/25 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4F8CFF]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center gap-8 justify-between relative z-10">
            <div className="space-y-3 max-w-lg text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 text-[#42E8F5] text-[11px] font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Real-Time 3D Multimodal Topology
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
                Harmonic Cross-Modal Neural Synthesis
              </h2>
              <p className="text-xs sm:text-sm text-[#9AA8C7] leading-relaxed">
                Interact with the live representation of your ingested assets. Documents, visual diagrams, audio wave streams, and video frames are projected into a unified vector coordinate system for zero-hallucination factual grounding.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2 rounded-lg bg-[#070B17]/70 border border-[#4F8CFF]/20 text-center">
                  <span className="block text-[10px] font-mono text-[#42E8F5] font-bold">DOC CUBE</span>
                  <span className="text-[11px] text-[#9AA8C7] font-medium">PDF & Text</span>
                </div>
                <div className="p-2 rounded-lg bg-[#070B17]/70 border border-[#4F8CFF]/20 text-center">
                  <span className="block text-[10px] font-mono text-[#818CF8] font-bold">OCTAHEDRON</span>
                  <span className="text-[11px] text-[#9AA8C7] font-medium">Vision</span>
                </div>
                <div className="p-2 rounded-lg bg-[#070B17]/70 border border-[#4F8CFF]/20 text-center">
                  <span className="block text-[10px] font-mono text-emerald-400 font-bold">TORUS RING</span>
                  <span className="text-[11px] text-[#9AA8C7] font-medium">Audio</span>
                </div>
                <div className="p-2 rounded-lg bg-[#070B17]/70 border border-[#4F8CFF]/20 text-center">
                  <span className="block text-[10px] font-mono text-purple-400 font-bold">ICOSAHEDRON</span>
                  <span className="text-[11px] text-[#9AA8C7] font-medium">Video</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-96 h-56 rounded-xl bg-[#070B17]/80 border border-[#4F8CFF]/30 shadow-lg relative overflow-hidden flex items-center justify-center">
              <Floating3DObjects className="w-full h-full" />
              <div className="absolute bottom-2 right-3 pointer-events-none">
                <span className="text-[10px] font-mono text-[#9AA8C7] bg-[#0D1428]/90 px-2 py-0.5 rounded border border-[#4F8CFF]/30">
                  Three.js WebGL Engine
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Interface Preview Showcase */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="bg-[#0D1428]/80 border border-[#4F8CFF]/20 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 justify-between">
            <div className="space-y-3 max-w-xl">
              <span className="text-[11px] font-semibold tracking-wider text-[#42E8F5] uppercase bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 px-2.5 py-1 rounded">
                Cross-Modal Synthesis
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F4F7FF]">
                Ask Questions Across Formats Simultaneously
              </h2>
              <p className="text-xs sm:text-sm text-[#9AA8C7] leading-relaxed">
                Query across multiple active sources in a single prompt. OmniMind AI analyzes documents,
                visuals, and recordings together, resolving corroborating evidence and highlighting discrepancies.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs bg-[#070B17]/80 text-[#F4F7FF] px-2.5 py-1 rounded-lg border border-[#4F8CFF]/25 font-mono">
                  #Technical-Spec.pdf
                </span>
                <span className="text-xs bg-[#070B17]/80 text-[#F4F7FF] px-2.5 py-1 rounded-lg border border-[#4F8CFF]/25 font-mono">
                  #System_Architecture.png
                </span>
                <span className="text-xs bg-[#070B17]/80 text-[#F4F7FF] px-2.5 py-1 rounded-lg border border-[#4F8CFF]/25 font-mono">
                  #Design_Review.m4a
                </span>
              </div>
            </div>

            <div className="w-full lg:w-96 p-4 rounded-xl bg-[#070B17]/90 border border-[#4F8CFF]/25 text-xs font-mono space-y-2 text-[#F4F7FF] shadow-lg">
              <div className="flex items-center justify-between text-[#42E8F5] font-semibold border-b border-[#4F8CFF]/20 pb-2">
                <span>OMNIMIND AI SYNTHESIS</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-sans font-medium">
                  VERIFIED CITATION
                </span>
              </div>
              <p className="text-[#F4F7FF] leading-relaxed">
                <span className="text-[#4F8CFF] font-semibold">Agreements:</span> Both the diagram and document specify vector embedding dimensions of 768.
              </p>
              <p className="text-[#F4F7FF] leading-relaxed">
                <span className="text-[#9AA8C7] font-semibold">Discrepancy:</span> The audio recording notes asynchronous queuing for video transcoding, while the spec describes synchronous pipelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Workflow Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-semibold tracking-wider text-[#42E8F5] uppercase">
            Product Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7FF]">
            From Raw Modality to Grounded Answer
          </h2>
          <p className="text-xs sm:text-sm text-[#9AA8C7] max-w-lg mx-auto">
            A transparent four-stage pipeline engineered to prevent hallucination.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0D1428]/75 border border-[#4F8CFF]/20 rounded-xl p-5 space-y-2.5 shadow-lg">
            <span className="text-xs font-bold font-mono text-[#42E8F5] bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 px-2 py-0.5 rounded">
              01
            </span>
            <h3 className="text-sm font-semibold text-[#F4F7FF]">Upload & Ingest</h3>
            <p className="text-xs text-[#9AA8C7] leading-relaxed">
              Upload supported PDFs, images, audio, or video files with validated MIME types and metadata inspection.
            </p>
          </div>
          <div className="bg-[#0D1428]/75 border border-[#4F8CFF]/20 rounded-xl p-5 space-y-2.5 shadow-lg">
            <span className="text-xs font-bold font-mono text-[#42E8F5] bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 px-2 py-0.5 rounded">
              02
            </span>
            <h3 className="text-sm font-semibold text-[#F4F7FF]">Extract & Embed</h3>
            <p className="text-xs text-[#9AA8C7] leading-relaxed">
              Deep OCR, vision analysis, audio transcription, and semantic vector chunking via Gemini models.
            </p>
          </div>
          <div className="bg-[#0D1428]/75 border border-[#4F8CFF]/20 rounded-xl p-5 space-y-2.5 shadow-lg">
            <span className="text-xs font-bold font-mono text-[#42E8F5] bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 px-2 py-0.5 rounded">
              03
            </span>
            <h3 className="text-sm font-semibold text-[#F4F7FF]">Hybrid Retrieval</h3>
            <p className="text-xs text-[#9AA8C7] leading-relaxed">
              Retrieve relevant passages across active workspace sources using vector cosine similarity and full-text keyword matching.
            </p>
          </div>
          <div className="bg-[#0D1428]/75 border border-[#4F8CFF]/20 rounded-xl p-5 space-y-2.5 shadow-lg">
            <span className="text-xs font-bold font-mono text-[#42E8F5] bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 px-2 py-0.5 rounded">
              04
            </span>
            <h3 className="text-sm font-semibold text-[#F4F7FF]">Verify Citations</h3>
            <p className="text-xs text-[#9AA8C7] leading-relaxed">
              Model answers are grounded in returned evidence chunks. Every citation links to verifiable source text and page numbers.
            </p>
          </div>
        </div>
      </section>

      {/* Modalities Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-[#4F8CFF]/20">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-semibold tracking-wider text-[#42E8F5] uppercase">
            Supported Modalities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7FF]">
            Engineered for Every Type of Knowledge
          </h2>
          <p className="text-xs sm:text-sm text-[#9AA8C7] max-w-md mx-auto">
            Native parsing, semantic extraction, and citation tracking across data formats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modalities.map((item) => (
            <div
              key={item.title}
              className="bg-[#0D1428]/75 border border-[#4F8CFF]/20 hover:border-[#42E8F5]/40 hover:shadow-[0_8px_24px_-4px_rgba(66,232,245,0.15)] rounded-xl p-5 space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#42E8F5]">
                  <item.icon className="w-4 h-4" />
                </div>
                <Badge variant="cyan" size="sm">
                  {item.badge}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F7FF]">{item.title}</h3>
              <p className="text-xs text-[#9AA8C7] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Reliability Pillars */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-[#4F8CFF]/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0D1428]/75 border border-[#4F8CFF]/20 rounded-xl p-5 space-y-2 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#42E8F5]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#F4F7FF]">Evidence Grounding</h4>
            <p className="text-xs text-[#9AA8C7] leading-relaxed">
              Every answer resolves citations against verified server-side evidence records.
              Model-hallucinated citation IDs are filtered out automatically.
            </p>
          </div>
          <div className="bg-[#0D1428]/75 border border-[#4F8CFF]/20 rounded-xl p-5 space-y-2 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#42E8F5]">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#F4F7FF]">Zero-Leakage Isolation</h4>
            <p className="text-xs text-[#9AA8C7] leading-relaxed">
              Strict per-user ownership and workspace scoping on all database queries, vector similarity
              searches, and document assets.
            </p>
          </div>
          <div className="bg-[#0D1428]/75 border border-[#4F8CFF]/20 rounded-xl p-5 space-y-2 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#42E8F5]">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#F4F7FF]">Google Gemini 2.5 Flash</h4>
            <p className="text-xs text-[#9AA8C7] leading-relaxed">
              Direct server-side orchestration with Gemini 2.5 Flash and text-embedding-004.
              No API keys or service role secrets are ever exposed to the client.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#4F8CFF]/20 py-8 px-4 sm:px-8 bg-[#070B17]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9AA8C7]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#4F8CFF] flex items-center justify-center text-white text-[10px]">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-semibold text-[#F4F7FF]">OmniMind AI</span>
            <span>— 3D Intelligence Workspace</span>
          </div>
          <div className="text-center sm:text-right">
            Engineered with React, TypeScript, Supabase PostgreSQL, and Google Gemini API.
          </div>
        </div>
      </footer>
    </div>
  );
};
