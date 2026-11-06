'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  Play,
  ArrowRight,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { useTurnProof } from '@/context/turnproof-context';

export default function VerifyPage() {
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
    isVerifying,
    runRoundTripVerification,
  } = useTurnProof();

  const [useCompiledMode, setUseCompiledMode] = useState(true);

  const handleRunLiveVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await runRoundTripVerification({
      rawPrompt: draftText,
      title: useCompiledMode
        ? 'Live Sanitized Round-Trip Check'
        : 'Live Uncompiled Raw Leak Check',
      scenario: 'Universal-3.5 Pro Entity Readback',
      voiceId,
      language,
      useCompiled: useCompiledMode,
    });
  };

  return (
    <div className="space-y-16">
      {/* Page Header */}
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="text-xs uppercase tracking-widest text-[#38BDF8] tabular-nums">
            Page 03 // /verify
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#F4F6FB] font-display">
            Round-Trip Entity Verification Lab
          </h1>
          <p className="text-lg text-[#A3B1C6] leading-relaxed">
            Synthesizes each turn via <code className="text-[#F08C4B] tabular-nums">assemblyai-tts-1</code>,
            wraps the 24 kHz <code className="text-[#F08C4B] tabular-nums">pcm_s16le</code>{' '}
            stream into a RIFF WAVE container, and transcribes it through{' '}
            <code className="text-[#38BDF8] tabular-nums">Universal-3.5 Pro</code>{' '}
            (<code className="text-[#A3B1C6] tabular-nums">POST /v2/transcript</code>)
            to prove that every booking code, price, and time survives synthesis.
          </p>
        </div>

        <Link
          href="/ledger"
          id="verify-to-ledger-link"
          className="secondary-pill-btn inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm"
        >
          <span>Export in Run Ledger</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      {/* Live Round-Trip Runner Form */}
      <section className="glass-surface rounded-2xl p-8 md:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#F08C4B] tabular-nums">
              Live Pipeline // TTS -&gt; 24 kHz WAV -&gt; Universal-3.5 Pro STT
            </div>
            <h2 className="text-2xl font-bold text-[#F4F6FB] font-display">
              Execute Live Round-Trip Readback Check
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-[#A3B1C6] cursor-pointer">
              <input
                id="verify-compile-toggle"
                type="checkbox"
                checked={useCompiledMode}
                onChange={(e) => setUseCompiledMode(e.target.checked)}
                className="rounded accent-[#F08C4B]"
              />
              <span>Apply Pre-Flight Sanitizer Before TTS</span>
            </label>
          </div>
        </div>

        <form onSubmit={handleRunLiveVerify} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="verify-prompt-input"
              className="block text-xs uppercase tracking-wider text-[#A3B1C6] tabular-nums"
            >
              Turn Prompt Containing Entities to Verify
            </label>
            <textarea
              id="verify-prompt-input"
              rows={3}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full rounded-xl bg-[#070A12]/90 border border-white/10 p-5 text-base text-[#F4F6FB] leading-relaxed focus:outline-none focus:border-[#F08C4B]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                id="verify-voice-select"
                aria-label="Voice ID for round-trip verification"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="rounded-full bg-[#131B2E] border border-white/10 px-4 py-2 text-xs text-[#F4F6FB] tabular-nums"
              >
                <option value="aai-jane">Voice: aai-jane</option>
                <option value="aai-felix">Voice: aai-felix</option>
              </select>

              <select
                id="verify-lang-select"
                aria-label="Language for round-trip verification"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-full bg-[#131B2E] border border-white/10 px-4 py-2 text-xs text-[#F4F6FB] tabular-nums"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="italian">Italian</option>
                <option value="portuguese">Portuguese</option>
              </select>
            </div>

            <button
              type="submit"
              id="run-roundtrip-verify-btn"
              disabled={isVerifying}
              className="copper-pill-btn inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm cursor-pointer disabled:opacity-45"
            >
              <ArrowsClockwise
                size={18}
                weight="bold"
                className={isVerifying ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              <span>
                {isVerifying
                  ? 'Synthesizing & Transcribing...'
                  : 'Run Live Round-Trip Verification'}
              </span>
            </button>
          </div>
        </form>
      </section>

      {/* Active Inspection Comparison Surface */}
      <section className="glass-surface rounded-2xl p-8 md:p-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#38BDF8] tabular-nums">
              Active Verification Record // {activeRun.id} · Transcript ID:{' '}
              {activeRun.transcriptId}
            </div>
            <h2 className="text-2xl font-bold text-[#F4F6FB] font-display">
              {activeRun.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-bold tabular-nums ${
                activeRun.verdict === 'PASS'
                  ? 'bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399]'
                  : 'bg-[#FB7185]/15 border border-[#FB7185]/40 text-[#FB7185]'
              }`}
            >
              {activeRun.verdict} · {activeRun.accuracyPercent}% ENTITY MATCH
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-[#A3B1C6] tabular-nums">
              Synthesized Input Sent to assemblyai-tts-1 (
              {activeRun.wasCompiled ? 'Sanitized' : 'Raw Uncompiled'})
            </div>
            <p className="text-lg text-[#F4F6FB] leading-relaxed">
              &ldquo;{activeRun.synthesizedText}&rdquo;
            </p>
            <div className="pt-2">
              <audio
                controls
                src={activeRun.audioUrl}
                className="w-full h-10"
                aria-label={`Play synthesized audio for ${activeRun.title}`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#38BDF8] tabular-nums">
              <span>Universal-3.5 Pro Readback Transcript</span>
              <span>Confidence: {(activeRun.sttConfidence * 100).toFixed(1)}%</span>
            </div>
            <p
              id="verify-active-transcript"
              className={`text-lg font-medium leading-relaxed ${
                activeRun.verdict === 'PASS'
                  ? 'text-[#F4F6FB]'
                  : 'text-[#FB7185]'
              }`}
            >
              &ldquo;{activeRun.sttTranscript}&rdquo;
            </p>
            <p className="text-sm text-[#A3B1C6] pt-1">
              {activeRun.bountyFinding}
            </p>
          </div>
        </div>

        {/* Entity Check Pills */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {activeRun.entities.map((ent, idx) => (
              <span
                key={`${ent.entity}-${idx}`}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tabular-nums ${
                  ent.matched
                    ? 'bg-[#34D399]/15 text-[#34D399]'
                    : 'bg-[#FB7185]/15 text-[#FB7185]'
                }`}
              >
                {ent.matched ? (
                  <CheckCircle size={15} weight="bold" aria-hidden="true" />
                ) : (
                  <WarningCircle size={15} weight="bold" aria-hidden="true" />
                )}
                <span>
                  {ent.category.toUpperCase()}: {ent.entity}
                </span>
              </span>
            ))}

            {activeRun.leakedBracketWords.map((leak) => (
              <span
                key={leak}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FB7185]/20 border border-[#FB7185]/50 text-xs font-bold text-[#FB7185] tabular-nums"
              >
                <WarningCircle size={15} weight="bold" aria-hidden="true" />
                <span>SPOKEN BRACKET LEAK: &ldquo;{leak}&rdquo;</span>
              </span>
            ))}
          </div>

          <span className="text-xs text-[#76869E] tabular-nums">
            X-Request-Id: {activeRun.requestId}
          </span>
        </div>
      </section>

      {/* Benchmark Matrix Cards (Max 2 per row per DESIGN.md) */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-[#A3B1C6] tabular-nums">
            Verified Multi-Voice &amp; Multilingual Suite
          </div>
          <h2 className="text-2xl font-bold text-[#F4F6FB] font-display">
            Captured Round-Trip Benchmark Matrix ({runs.length} Runs)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {runs.map((run) => {
            const isSelected = run.id === activeRun.id;
            return (
              <div
                key={run.id}
                className={`glass-surface rounded-2xl p-8 space-y-5 transition-colors ${
                  isSelected ? 'border-[#F08C4B]/60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                      run.verdict === 'PASS'
                        ? 'bg-[#34D399]/15 text-[#34D399]'
                        : 'bg-[#FB7185]/15 text-[#FB7185]'
                    }`}
                  >
                    {run.verdict} · {run.accuracyPercent}% LOCK
                  </span>
                  <span className="text-xs text-[#76869E] tabular-nums">
                    {run.id} · {run.voiceId} ({run.language})
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-[#F4F6FB] font-display">
                    {run.title}
                  </h3>
                  <p className="text-sm text-[#A3B1C6] leading-relaxed">
                    &ldquo;{run.sttTranscript}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4">
                  <span className="text-xs text-[#76869E] tabular-nums">
                    {run.wordBoundaries.length} WordBoundaries ·{' '}
                    {run.billedCharacters} chars
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveRunById(run.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F08C4B] hover:underline cursor-pointer"
                  >
                    <Play size={14} weight="fill" aria-hidden="true" />
                    <span>Inspect &amp; Audition</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
