'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Scissors,
  ShieldCheck,
  Archive,
  CheckCircle,
  Warning,
  SpeakerHigh,
} from '@phosphor-icons/react';
import { useTurnProof } from '@/context/turnproof-context';
import { WaveformScissor } from '@/components/waveform-scissor';

const VOICE_OPTIONS = [
  { id: 'aai-jane', label: 'aai-jane (Warm Conversational)' },
  { id: 'aai-felix', label: 'aai-felix (Clear Broadcast)' },
];

const LANGUAGE_OPTIONS = [
  { id: 'english', label: 'English (EN)' },
  { id: 'spanish', label: 'Spanish (ES)' },
  { id: 'french', label: 'French (FR)' },
  { id: 'german', label: 'German (DE)' },
  { id: 'italian', label: 'Italian (IT)' },
  { id: 'portuguese', label: 'Portuguese (PT)' },
];

export default function StagePage() {
  const router = useRouter();
  const {
    runs,
    activeRun,
    setActiveRunById,
    draftText,
    setDraftText,
    voiceId,
    setVoiceId,
    language,
    setLanguage,
    bargeInCutMs,
    setBargeInCutMs,
    compiledDraft,
  } = useTurnProof();

  const handleOpenInStudio = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/studio');
  };

  return (
    <div className="space-y-16">
      {/* Hero Section (No biscuit pill above headline per anti-slop rules) */}
      <section className="max-w-4xl space-y-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#F4F6FB] font-display leading-[1.08]">
          Prove every spoken turn before your voice agent takes the call.
        </h1>
        <p className="text-lg md:text-xl text-[#A3B1C6] leading-relaxed max-w-3xl">
          Raw LLM turns break voice agents in two places: stage tags like{' '}
          <code className="text-[#FB7185] tabular-nums">[pause]</code> get read
          aloud as literal words by <code className="text-[#F08C4B] tabular-nums">assemblyai-tts-1</code>,
          and caller barge-in cuts off booking codes before the user hears them.
          TurnProof sanitizes the prompt, slices interrupted turns at the exact
          millisecond, and verifies entity readback through{' '}
          <code className="text-[#38BDF8] tabular-nums">Universal-3.5 Pro</code>.
        </p>
      </section>

      {/* Form-as-CTA Primary Turn Composer */}
      <section aria-labelledby="composer-heading">
        <form
          onSubmit={handleOpenInStudio}
          className="glass-surface rounded-2xl p-8 md:p-10 space-y-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-1.5">
              <h2
                id="composer-heading"
                className="text-2xl font-bold text-[#F4F6FB] font-display"
              >
                Draft or Audition a Voice Agent Turn
              </h2>
              <p className="text-sm text-[#A3B1C6]">
                Load a verified AssemblyAI capture below or type your own agent
                response to inspect hazards and stream 24 kHz PCM audio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label htmlFor="stage-voice-select" className="sr-only">
                  Select AssemblyAI Voice
                </label>
                <select
                  id="stage-voice-select"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="rounded-full bg-[#131B2E] border border-white/10 px-4 py-2 text-xs text-[#F4F6FB] tabular-nums focus:outline-none focus:border-[#F08C4B]"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="stage-lang-select" className="sr-only">
                  Select Synthesis Language
                </label>
                <select
                  id="stage-lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-full bg-[#131B2E] border border-white/10 px-4 py-2 text-xs text-[#F4F6FB] tabular-nums focus:outline-none focus:border-[#F08C4B]"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="stage-turn-textarea"
              className="block text-xs uppercase tracking-wider text-[#A3B1C6] tabular-nums"
            >
              Agent Turn Script Input
            </label>
            <textarea
              id="stage-turn-textarea"
              rows={3}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full rounded-xl bg-[#070A12]/85 border border-white/10 p-5 text-lg text-[#F4F6FB] leading-relaxed focus:outline-none focus:border-[#F08C4B]"
              placeholder="Enter the voice agent turn to compile and test..."
            />
          </div>

          {/* Instant Pre-Flight Telemetry Row */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-2 border-t border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {compiledDraft.hazards.length > 0 ? (
                <span className="inline-flex items-center gap-2 text-[#FB7185] font-medium">
                  <Warning size={18} weight="bold" aria-hidden="true" />
                  <span>
                    {compiledDraft.hazards.length} prompt normalization{' '}
                    {compiledDraft.hazards.length === 1 ? 'hazard' : 'hazards'}{' '}
                    detected
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-[#34D399] font-medium">
                  <CheckCircle size={18} weight="bold" aria-hidden="true" />
                  <span>Prompt is clean for assemblyai-tts-1</span>
                </span>
              )}
              <span className="text-[#76869E] tabular-nums">
                {compiledDraft.characterCount} billed chars · Opening sentence:{' '}
                {compiledDraft.firstSentenceLength} chars
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/verify"
                id="stage-to-verify-link"
                className="secondary-pill-btn inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm"
              >
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Verify Round-Trip STT</span>
              </Link>
              <button
                type="submit"
                id="stage-compile-open-studio-btn"
                className="copper-pill-btn inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm cursor-pointer"
              >
                <span>Compile &amp; Open in Studio</span>
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Live Captured Audio Audition Stage */}
      <section className="glass-surface rounded-2xl p-8 md:p-10 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-wider text-[#38BDF8] tabular-nums">
              Audition Captured 24 kHz Stream // {activeRun.id}
            </div>
            <h2 className="text-2xl font-bold text-[#F4F6FB] font-display">
              {activeRun.title}
            </h2>
          </div>
          <div className="text-xs text-[#A3B1C6] tabular-nums">
            X-Request-Id: {activeRun.requestId}
          </div>
        </div>

        <WaveformScissor
          idPrefix="stage"
          audioUrl={activeRun.audioUrl}
          durationMs={activeRun.audioDurationMs}
          waveformPeaks={activeRun.waveformPeaks}
          wordBoundaries={activeRun.wordBoundaries}
          cutMs={bargeInCutMs}
          onChangeCutMs={setBargeInCutMs}
          interactive={true}
        />

        {/* Preset Scenario Selector Row */}
        <div className="pt-4 border-t border-white/[0.08] space-y-3">
          <div className="text-xs uppercase tracking-wider text-[#76869E] tabular-nums">
            Switch Captured AssemblyAI Benchmark Scenario:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {runs.slice(0, 4).map((r) => {
              const isSelected = r.id === activeRun.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRunById(r.id)}
                  className={`text-left p-5 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#131B2E] border-[#F08C4B]/60'
                      : 'bg-[#070A12]/60 border-white/[0.07] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#F08C4B] tabular-nums">
                      {r.id} · {r.voiceId} ({r.language})
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full ${
                        r.verdict === 'PASS'
                          ? 'bg-[#34D399]/15 text-[#34D399]'
                          : 'bg-[#FB7185]/15 text-[#FB7185]'
                      }`}
                    >
                      {r.verdict} · {r.accuracyPercent}%
                    </span>
                  </div>
                  <div className="text-base font-semibold text-[#F4F6FB] flex items-center gap-2">
                    <SpeakerHigh
                      size={16}
                      className="text-[#38BDF8] shrink-0"
                      aria-hidden="true"
                    />
                    <span>{r.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Overview Linking All Real Routes */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-surface rounded-2xl p-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#F08C4B] tabular-nums">
            <span>ROUTE 02 // /studio</span>
            <Scissors size={18} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-[#F4F6FB] font-display">
            Millisecond Barge-In Context Slicer
          </h3>
          <p className="text-base text-[#A3B1C6] leading-relaxed">
            Uses real <code className="text-[#38BDF8] tabular-nums">WordBoundaries</code>{' '}
            frames from <code className="text-[#F08C4B] tabular-nums">POST /v1/speech/events</code>{' '}
            to split what the caller actually heard before interrupting from the
            unheard tail of the turn, patching your LLM conversation history automatically.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#F08C4B] hover:underline"
            >
              <span>Open Studio Workbench</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="glass-surface rounded-2xl p-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#38BDF8] tabular-nums">
            <span>ROUTES 03 &amp; 04 // /verify &amp; /ledger</span>
            <Archive size={18} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-[#F4F6FB] font-display">
            Universal-3.5 Pro Readback &amp; Bug-Bounty Export
          </h3>
          <p className="text-base text-[#A3B1C6] leading-relaxed">
            Pipes synthesized 24 kHz PCM audio into{' '}
            <code className="text-[#38BDF8] tabular-nums">Universal-3.5 Pro</code>{' '}
            to verify booking codes, dollar amounts, and timestamps, then packages
            reproducible protocol reports with exact <code className="text-[#F08C4B] tabular-nums">X-Request-Id</code>{' '}
            telemetry.
          </p>
          <div className="pt-2 flex items-center gap-6">
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#38BDF8] hover:underline"
            >
              <span>Open Verification Lab</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/ledger"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#34D399] hover:underline"
            >
              <span>Open Run Ledger</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
