'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  ArrowSquareOut,
  DownloadSimple,
  Waveform,
  ShieldCheck,
  Bug,
  Sparkle,
  FilmSlate,
} from '@phosphor-icons/react';

interface Scene {
  time: number;
  label: string;
  badge: string;
  desc: string;
}

const SCENES: Scene[] = [
  {
    time: 0,
    label: '01. Stage',
    badge: '00:00 · Scissor Cut',
    desc: 'Auditioning Emma 24 kHz WAV capture, interactive waveform scissor, and 4,620ms barge-in clamp.',
  },
  {
    time: 35,
    label: '02. Studio',
    badge: '00:35 · Compiler',
    desc: 'Live prompt sanitizer stripping vocalized [pause] stage tags and formatting clean speech tokens.',
  },
  {
    time: 58,
    label: '03. Verify',
    badge: '00:58 · STT Lab',
    desc: 'Universal-3.5 Pro entity readback grading, tracking flight numbers, dates, and currency accuracy.',
  },
  {
    time: 84,
    label: '04. Ledger',
    badge: '01:24 · Bounty Telemetry',
    desc: 'Documented AssemblyAI bug findings (TP-2026-02 stage tag leak) and reproducible curl payloads.',
  },
];

const TRANSCRIPT_LINES = [
  { time: '00:00', text: 'Welcome to TurnProof, the pre-flight prompt compiler and barge-in context slicer built for AssemblyAI Text-to-Speech.' },
  { time: '00:10', text: 'When users barge in on conversational voice agents, late audio buffers waste API tokens and disorient callers.' },
  { time: '00:20', text: 'TurnProof cuts outbound audio at the exact millisecond of interruption, preserving conversational turn integrity.' },
  { time: '00:35', text: 'In the Studio, we sanitize stage directions like bracketed pause tags, preventing raw prompt artifacts from leaking into speech.' },
  { time: '00:58', text: 'Our Verification engine passes generated speech through AssemblyAI Universal-3.5 Pro to grade entity readbacks with word-level accuracy.' },
  { time: '01:14', text: 'Every run generates verifiable proof tokens, ensuring mission-critical voice agents speak exactly what was intended.' },
  { time: '01:24', text: 'Finally, the Ledger exports reproducible bug-bounty telemetry and audit-grade JSON packets for the AssemblyAI developer community.' },
  { time: '01:42', text: 'TurnProof: verified turns, zero vocalized hallucinations, and seamless conversational voice agents.' },
];

export default function DemoPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        setVideoError('Autoplay blocked. Click play on video controls.');
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const jumpTo = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in" id="main-workspace">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F08C4B]/10 border border-[#F08C4B]/30 text-xs font-mono text-[#F08C4B] mb-2">
            <Sparkle size={14} weight="fill" />
            Hackathon Showcase Walkthrough · 112s
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#F4F6FB] font-display">
            TurnProof Master Demo Video
          </h1>
          <p className="text-[#A3B1C6] text-sm md:text-base mt-1 max-w-2xl">
            Complete synchronized walkthrough featuring AssemblyAI <span className="text-[#F08C4B] font-mono">aai-felix</span> narration,
            burned-in subtitles, atmospheric ambient music, and live 24 kHz WAV audio playback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://github.com/Pizzylee001/turnproof/blob/main/docs/demo/turnproof-demo-walkthrough.mp4"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-[#F4F6FB] transition-colors"
          >
            <ArrowSquareOut size={16} />
            Watch on GitHub
          </a>
          <a
            href="/demo/turnproof-demo-walkthrough.mp4"
            download="turnproof-demo-walkthrough.mp4"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F08C4B] hover:bg-[#F29D63] text-[#070A12] text-xs font-bold transition-colors"
          >
            <DownloadSimple size={16} weight="bold" />
            Download MP4 (9.6 MB)
          </a>
        </div>
      </div>

      {/* Main Video Cinema Container */}
      <div className="relative rounded-2xl overflow-hidden bg-[#0A0F1D] border border-white/[0.1] shadow-2xl">
        <div className="relative aspect-[16/10] max-h-[640px] bg-black">
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
            }}
            onError={() => {
              setVideoError('Video source failed to stream. Use the direct GitHub or Download link above.');
            }}
          >
            <source src="/demo/turnproof-demo-walkthrough.mp4" type="video/mp4" />
            <source src="https://raw.githubusercontent.com/Pizzylee001/turnproof/main/docs/demo/turnproof-demo-walkthrough.mp4" type="video/mp4" />
            <source src="/demo/turnproof-demo-walkthrough.webm" type="video/webm" />
            Your browser does not support HTML5 video tags.
          </video>

          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
              <div className="max-w-md p-6 rounded-2xl bg-[#162032] border border-[#F08C4B]/40 text-[#F4F6FB] space-y-3">
                <p className="text-sm font-medium text-[#F08C4B]">{videoError}</p>
                <div className="flex justify-center gap-3">
                  <a
                    href="https://github.com/Pizzylee001/turnproof/blob/main/docs/demo/turnproof-demo-walkthrough.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-[#F08C4B] text-[#070A12] text-xs font-bold"
                  >
                    Watch Directly on GitHub
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Control Bar Info */}
        <div className="p-4 bg-[#101726]/90 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[#F08C4B] text-[#070A12] flex items-center justify-center hover:bg-[#F29D63] transition-colors shadow-lg"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" className="ml-0.5" />}
            </button>
            <div>
              <div className="text-xs font-mono text-[#F4F6FB]">
                {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / 01:52
              </div>
              <div className="text-[11px] text-[#A3B1C6]">
                AssemblyAI TTS <span className="text-[#34D399]">aai-felix</span> + Ambient Synth Bed (-22dB)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#A3B1C6]">
            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] font-mono">
              1440x900 · 30fps
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20 font-mono">
              Burned Subtitles
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#F08C4B]/10 text-[#F08C4B] border border-[#F08C4B]/20 font-mono">
              Real WAV Clips
            </span>
          </div>
        </div>
      </div>

      {/* Chapter Navigation Cards */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase font-mono tracking-wider text-[#A3B1C6]">
          Interactive Scene Markers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SCENES.map((scene) => (
            <button
              key={scene.label}
              type="button"
              onClick={() => jumpTo(scene.time)}
              className="p-4 rounded-xl bg-[#101726] border border-white/[0.08] hover:border-[#F08C4B]/40 hover:bg-[#162032] text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#F4F6FB] group-hover:text-[#F08C4B] transition-colors">
                  {scene.label}
                </span>
                <span className="font-mono text-[11px] text-[#F08C4B] px-1.5 py-0.5 rounded bg-[#F08C4B]/10">
                  {scene.badge}
                </span>
              </div>
              <p className="text-xs text-[#A3B1C6] line-clamp-2 leading-relaxed">
                {scene.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column: Narration Transcript + Bounty Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Narration Transcript */}
        <div className="p-5 rounded-2xl bg-[#101726] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-sm font-bold text-[#F4F6FB] flex items-center gap-2">
              <FilmSlate size={18} className="text-[#F08C4B]" />
              Voiceover Narration Script
            </h3>
            <span className="text-[11px] font-mono text-[#A3B1C6]">voice: aai-felix</span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar text-xs">
            {TRANSCRIPT_LINES.map((line, idx) => (
              <div key={idx} className="flex gap-3 text-[#A3B1C6]">
                <span className="font-mono text-[#F08C4B] shrink-0">{line.time}</span>
                <p className="leading-relaxed text-[#F4F6FB]/90">{line.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bug Bounty Telemetry Card */}
        <div className="p-5 rounded-2xl bg-[#101726] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-sm font-bold text-[#F4F6FB] flex items-center gap-2">
              <Bug size={18} className="text-[#F08C4B]" />
              AssemblyAI Bug Findings Highlighted
            </h3>
            <span className="text-[11px] font-mono text-[#34D399]">Reproducible</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[#F08C4B] font-semibold">TP-2026-02</span>
                <span className="text-[10px] font-mono text-[#A3B1C6]">tts.us.assemblyai.com</span>
              </div>
              <p className="text-[#F4F6FB]">
                Square bracket stage tags <code className="text-[#F08C4B]">[pause]</code> in SSE stream are vocalized aloud as &quot;Pause.&quot;
              </p>
              <p className="text-[11px] text-[#A3B1C6]">
                TurnProof compiles prompts pre-flight to strip bracket artifacts and maintain pristine conversational audio.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[#F08C4B] font-semibold">TP-2026-03</span>
                <span className="text-[10px] font-mono text-[#A3B1C6]">POST /v2/transcript</span>
              </div>
              <p className="text-[#F4F6FB]">
                Missing <code className="text-[#F08C4B]">language_code</code> with speech_models universal-3-5-pro returns HTTP 200 with empty text.
              </p>
              <p className="text-[11px] text-[#A3B1C6]">
                TurnProof auto-injects default en_us to guarantee verified round-trip entity readback grading.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
