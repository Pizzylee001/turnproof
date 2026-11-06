'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sparkle,
  Warning,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  Lightning,
} from '@phosphor-icons/react';
import { useTurnProof } from '@/context/turnproof-context';
import { WaveformScissor } from '@/components/waveform-scissor';
import { sliceBargeInTurn } from '@/lib/turnproof-engine';

export default function StudioPage() {
  const {
    activeRun,
    draftText,
    setDraftText,
    voiceId,
    setVoiceId,
    language,
    setLanguage,
    bargeInCutMs,
    setBargeInCutMs,
    compiledDraft,
    isSynthesizing,
    synthesizeLiveTurn,
  } = useTurnProof();

  const [copiedJson, setCopiedJson] = useState(false);

  const bargeSlice = useMemo(
    () => sliceBargeInTurn(activeRun.wordBoundaries, bargeInCutMs),
    [activeRun.wordBoundaries, bargeInCutMs]
  );

  const copyPatchedJson = () => {
    navigator.clipboard.writeText(
      JSON.stringify(bargeSlice.patchedAssistantMessage, null, 2)
    );
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  return (
    <div className="space-y-16">
      {/* Page Header */}
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-[#F08C4B] tabular-nums">
            Page 02 // /studio
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#F4F6FB] font-display">
            Turn Compiler &amp; Barge-In Scissor
          </h1>
          <p className="text-lg text-[#A3B1C6] leading-relaxed">
            Sanitize LLM stage tags and alphanumeric codes before billing a
            character, then drag the copper cut-line across the 24 kHz stream to
            compute the exact post-interrupt conversation state.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/verify"
            id="studio-to-verify-link"
            className="secondary-pill-btn inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm"
          >
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Verify with Universal-3.5 Pro</span>
          </Link>
        </div>
      </section>

      {/* Section 1: Pre-Flight Prompt Sanitizer (Spacious 2-Column Diff, Zero Nested Cards) */}
      <section className="glass-surface rounded-2xl p-8 md:p-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#F08C4B] tabular-nums">
              Step 01 // Pre-Flight Prompt Sanitizer
            </div>
            <h2 className="text-2xl font-bold text-[#F4F6FB] font-display">
              Raw LLM Turn vs. Compiled AssemblyAI-TTS-1 Payload
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              id="studio-voice-select"
              aria-label="Select AssemblyAI Voice"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="rounded-full bg-[#131B2E] border border-white/10 px-4 py-2 text-xs text-[#F4F6FB] tabular-nums"
            >
              <option value="aai-jane">Voice: aai-jane</option>
              <option value="aai-felix">Voice: aai-felix</option>
            </select>

            <select
              id="studio-lang-select"
              aria-label="Select Synthesis Language"
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

            <button
              type="button"
              id="studio-stream-raw-btn"
              disabled={isSynthesizing}
              onClick={() => synthesizeLiveTurn(false)}
              className="secondary-pill-btn px-4 py-2.5 rounded-full text-xs font-medium cursor-pointer disabled:opacity-45"
            >
              Stream Raw (Test Leak)
            </button>

            <button
              type="button"
              id="studio-stream-compiled-btn"
              disabled={isSynthesizing}
              onClick={() => synthesizeLiveTurn(true)}
              className="copper-pill-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm cursor-pointer disabled:opacity-45"
            >
              <Lightning size={16} weight="fill" aria-hidden="true" />
              <span>
                {isSynthesizing
                  ? 'Streaming 24 kHz...'
                  : 'Compile & Stream 24 kHz'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Raw Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="studio-raw-textarea"
                className="text-xs uppercase tracking-wider font-semibold text-[#A3B1C6] tabular-nums"
              >
                Raw LLM Turn Input
              </label>
              <span className="text-xs text-[#FB7185] tabular-nums">
                {compiledDraft.hazards.length}{' '}
                {compiledDraft.hazards.length === 1 ? 'hazard' : 'hazards'}{' '}
                flagged
              </span>
            </div>
            <textarea
              id="studio-raw-textarea"
              rows={4}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full rounded-xl bg-[#070A12]/90 border border-white/10 p-5 text-base text-[#F4F6FB] leading-relaxed focus:outline-none focus:border-[#F08C4B]"
            />
          </div>

          {/* Compiled Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#34D399] tabular-nums">
                Sanitized AssemblyAI-TTS-1 Payload
              </span>
              <span className="text-xs text-[#38BDF8] tabular-nums">
                {compiledDraft.characterCount} chars ·{' '}
                {compiledDraft.requiresFirstSentenceFlush
                  ? 'Requires WS Flush (<50c)'
                  : 'Auto-Flush Ready (>=50c)'}
              </span>
            </div>
            <div
              id="studio-compiled-output"
              className="w-full min-h-[124px] rounded-xl bg-[#070A12]/90 border border-[#34D399]/35 p-5 text-base text-[#F4F6FB] leading-relaxed"
            >
              {compiledDraft.compiledText}
            </div>
          </div>
        </div>

        {/* Hazard Rule Breakdown List */}
        {compiledDraft.hazards.length > 0 && (
          <div className="pt-6 border-t border-white/[0.08] space-y-3">
            <div className="text-xs uppercase tracking-wider text-[#A3B1C6] tabular-nums">
              Applied AssemblyAI-TTS-1 Normalization Rules:
            </div>
            <ul className="space-y-2.5 text-sm">
              {compiledDraft.hazards.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-wrap items-baseline gap-2.5 text-[#A3B1C6]"
                >
                  <Warning
                    size={15}
                    className="text-[#F08C4B] shrink-0 translate-y-0.5"
                    aria-hidden="true"
                  />
                  <code className="text-[#FB7185] tabular-nums font-medium">
                    {h.originalToken}
                  </code>
                  <span>-&gt;</span>
                  <code className="text-[#34D399] tabular-nums font-medium">
                    {h.replacementToken}
                  </code>
                  <span className="text-[#76869E]">({h.reason})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Section 2: Signature Millisecond Barge-In Scissor */}
      <section className="glass-surface rounded-2xl p-8 md:p-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#38BDF8] tabular-nums">
              Step 02 // Signature Instrument · {activeRun.id}
            </div>
            <h2 className="text-2xl font-bold text-[#F4F6FB] font-display">
              Millisecond Barge-In Waveform Scissor
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#A3B1C6] tabular-nums">
            <span>Server-Timing: {activeRun.serverTiming}</span>
            <span>·</span>
            <span>{activeRun.audioChunkCount} PCM Frames</span>
          </div>
        </div>

        <WaveformScissor
          idPrefix="studio"
          audioUrl={activeRun.audioUrl}
          durationMs={activeRun.audioDurationMs}
          waveformPeaks={activeRun.waveformPeaks}
          wordBoundaries={activeRun.wordBoundaries}
          cutMs={bargeInCutMs}
          onChangeCutMs={setBargeInCutMs}
          interactive={true}
        />

        {/* Spacious 2-Column Split: Spoken vs Dropped */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-white/[0.08]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#34D399] tabular-nums">
                Spoken Into Caller Ear Before Interrupt (heard_text)
              </span>
              <span className="text-xs text-[#A3B1C6] tabular-nums">
                {bargeSlice.heardWords.length} of{' '}
                {activeRun.wordBoundaries.length} words
              </span>
            </div>
            <p
              id="studio-heard-text"
              className="text-xl font-medium text-[#F4F6FB] leading-relaxed"
            >
              {bargeSlice.heardText ||
                '(Caller interrupted before first word boundary at 274 ms)'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#FB7185] tabular-nums">
                Truncated on Floor After Interrupt (cut_text)
              </span>
              <span className="text-xs text-[#76869E] tabular-nums">
                {bargeSlice.cutWords.length} words unheard
              </span>
            </div>
            <p
              id="studio-cut-text"
              className="text-xl text-[#76869E] line-through leading-relaxed"
            >
              {bargeSlice.cutText ||
                '(Full turn completed without caller interruption)'}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Patched LLM Context Payload & Withheld Entities */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 glass-surface rounded-2xl p-8 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#F08C4B] tabular-nums">
              Entity Safety Guard
            </span>
            <Sparkle size={18} className="text-[#F08C4B]" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-[#F4F6FB] font-display">
            Unheard Entities Withheld from Agent Memory
          </h3>
          <p className="text-sm text-[#A3B1C6] leading-relaxed">
            When a caller barges in at{' '}
            <strong className="text-[#F4F6FB] tabular-nums">
              {bargeInCutMs.toLocaleString()} ms
            </strong>
            , any confirmation code, price, or appointment time scheduled after
            that millisecond never reached the caller&apos;s ear. TurnProof tags
            them as withheld so your voice agent repeats them on the next turn.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            {bargeSlice.withheldEntities.length > 0 ? (
              bargeSlice.withheldEntities.map((ent) => (
                <span
                  key={ent}
                  className="px-3.5 py-1.5 rounded-full bg-[#FB7185]/15 border border-[#FB7185]/40 text-xs font-semibold text-[#FB7185] tabular-nums"
                >
                  Withheld: {ent}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-2 text-xs text-[#34D399] font-medium tabular-nums">
                <CheckCircle size={16} weight="bold" aria-hidden="true" />
                <span>All critical entities were spoken before cut-line</span>
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 glass-surface rounded-2xl p-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#38BDF8] tabular-nums">
              Patched LLM Conversation State JSON
            </span>
            <button
              type="button"
              id="copy-patched-json-btn"
              onClick={copyPatchedJson}
              className="secondary-pill-btn inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tabular-nums cursor-pointer"
            >
              {copiedJson ? (
                <>
                  <Check
                    size={14}
                    className="text-[#34D399]"
                    aria-hidden="true"
                  />
                  <span>Copied JSON</span>
                </>
              ) : (
                <>
                  <Copy size={14} aria-hidden="true" />
                  <span>Copy Patched Message</span>
                </>
              )}
            </button>
          </div>

          <pre
            id="studio-patched-json-pre"
            className="rounded-xl bg-[#070A12]/90 border border-white/[0.07] p-5 text-xs text-[#F4F6FB] tabular-nums overflow-x-auto leading-relaxed"
          >
            {JSON.stringify(bargeSlice.patchedAssistantMessage, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
