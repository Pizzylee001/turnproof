'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Bug,
  Code,
  Scissors,
  DownloadSimple,
} from '@phosphor-icons/react';
import { useTurnProof } from '@/context/turnproof-context';
import { buildBugBountyMarkdown } from '@/lib/turnproof-engine';

export default function LedgerPage() {
  const { runs, activeRun, setActiveRunById } = useTurnProof();
  const [copiedMode, setCopiedMode] = useState<'bounty' | 'code' | null>(null);
  const [codeLang, setCodeLang] = useState<'typescript' | 'python'>(
    'typescript'
  );

  const bountyMarkdown = useMemo(
    () =>
      buildBugBountyMarkdown({
        runId: activeRun.id,
        requestId: activeRun.requestId,
        voiceId: activeRun.voiceId,
        language: activeRun.language,
        rawPrompt: activeRun.rawPrompt,
        compiledPrompt: activeRun.compiledPrompt,
        sttTranscript: activeRun.sttTranscript,
        serverTiming: activeRun.serverTiming,
        verdict: activeRun.verdict,
        notes: activeRun.bountyFinding,
      }),
    [activeRun]
  );

  const agentExportSnippet = useMemo(() => {
    if (codeLang === 'typescript') {
      return `// TurnProof Verified Voice Agent Streaming Snippet (TypeScript)
// Verified Run: ${activeRun.id} | X-Request-Id: ${activeRun.requestId}
const response = await fetch("https://tts.us.assemblyai.com/v1/speech/events", {
  method: "POST",
  headers: {
    Authorization: process.env.ASSEMBLYAI_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: ${JSON.stringify(activeRun.compiledPrompt)},
    voice_id: "${activeRun.voiceId}",
    model: "assemblyai-tts-1",
    language: "${activeRun.language}",
    sample_rate: 24000,
    encoding: "pcm_s16le",
    word_boundaries: true,
  }),
});`;
    }
    return `# TurnProof Verified Voice Agent Streaming Snippet (Python)
# Verified Run: ${activeRun.id} | X-Request-Id: ${activeRun.requestId}
import os, requests

res = requests.post(
    "https://tts.us.assemblyai.com/v1/speech/events",
    headers={"Authorization": os.environ["ASSEMBLYAI_API_KEY"]},
    json={
        "text": ${JSON.stringify(activeRun.compiledPrompt)},
        "voice_id": "${activeRun.voiceId}",
        "model": "assemblyai-tts-1",
        "language": "${activeRun.language}",
        "sample_rate": 24000,
        "encoding": "pcm_s16le",
        "word_boundaries": True,
    },
    stream=True,
)`;
  }, [activeRun, codeLang]);

  const copyText = (text: string, mode: 'bounty' | 'code') => {
    navigator.clipboard.writeText(text);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 1800);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([bountyMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeRun.id.toLowerCase()}-bounty-packet.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-16">
      {/* Page Header */}
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="text-xs uppercase tracking-widest text-[#34D399] tabular-nums">
            Page 04 // /ledger
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#F4F6FB] font-display">
            Saved Runs, Code Export &amp; Bug-Bounty Studio
          </h1>
          <p className="text-lg text-[#A3B1C6] leading-relaxed">
            Inspect every saved synthesis and STT verification run, export
            sanitized production streaming code, or generate a reproducible
            Hackathon Bug-Bounty packet with real{' '}
            <code className="text-[#F08C4B] tabular-nums">X-Request-Id</code>{' '}
            and <code className="text-[#38BDF8] tabular-nums">Server-Timing</code>{' '}
            telemetry.
          </p>
        </div>

        <Link
          href="/studio"
          id="ledger-to-studio-link"
          className="secondary-pill-btn inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm"
        >
          <Scissors size={16} aria-hidden="true" />
          <span>Open Active Run in Studio</span>
        </Link>
      </section>

      {/* Verified Bug-Bounty Findings Discovered Live */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-surface rounded-2xl p-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#FB7185] tabular-nums">
            <span>VERIFIED PROTOCOL FINDING #01</span>
            <Bug size={18} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-[#F4F6FB] font-display">
            Bracket-to-Paren Spoken Tag Leak on POST /v1/speech/events
          </h2>
          <p className="text-sm text-[#A3B1C6] leading-relaxed">
            When an LLM emits <code className="text-[#FB7185]">[pause]</code> or{' '}
            <code className="text-[#FB7185]">[wait]</code>,{' '}
            <code className="text-[#F08C4B]">assemblyai-tts-1</code> rewrites
            square brackets into round brackets <code className="text-[#FB7185]">(pause)</code>{' '}
            inside the <code className="text-[#38BDF8]">WordBoundaries</code>{' '}
            event (`0 ms` to `501 ms`) and speaks the word &ldquo;Pause&rdquo;
            aloud. Verified via Universal-3.5 Pro in Run{' '}
            <strong className="text-[#F4F6FB] tabular-nums">TP-2026-02</strong>.
          </p>
        </div>

        <div className="glass-surface rounded-2xl p-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#F08C4B] tabular-nums">
            <span>VERIFIED PROTOCOL FINDING #02</span>
            <Bug size={18} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-[#F4F6FB] font-display">
            Silent Empty Transcript when language_detection=false on Universal-3.5 Pro
          </h2>
          <p className="text-sm text-[#A3B1C6] leading-relaxed">
            Submitting <code className="text-[#F08C4B]">{`{"speech_models": ["universal-3-5-pro"], "language_detection": false}`}</code>{' '}
            to <code className="text-[#38BDF8]">POST /v2/transcript</code>{' '}
            without an explicit <code className="text-[#A3B1C6]">language_code</code>{' '}
            returns HTTP 200 with <code className="text-[#FB7185]">{`status: "completed", text: ""`}</code>{' '}
            instead of defaulting to English or returning a 400 validation error.
          </p>
        </div>
      </section>

      {/* Two-Column Export Studio: Bug Bounty Markdown + Production Code */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bug Bounty Packet Generator */}
        <div className="glass-surface rounded-2xl p-8 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-[#F08C4B] tabular-nums">
                Bug-Bounty &amp; Edge-Case Packet // {activeRun.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="download-bounty-md-btn"
                  onClick={downloadMarkdown}
                  className="secondary-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs cursor-pointer"
                >
                  <DownloadSimple size={14} aria-hidden="true" />
                  <span>Download .md</span>
                </button>
                <button
                  type="button"
                  id="copy-bounty-md-btn"
                  onClick={() => copyText(bountyMarkdown, 'bounty')}
                  className="copper-pill-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs cursor-pointer"
                >
                  {copiedMode === 'bounty' ? (
                    <>
                      <Check size={14} weight="bold" aria-hidden="true" />
                      <span>Copied Report</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre
              id="ledger-bounty-markdown-pre"
              className="rounded-xl bg-[#070A12]/90 border border-white/[0.07] p-5 text-xs text-[#F4F6FB] tabular-nums overflow-x-auto leading-relaxed whitespace-pre-wrap"
            >
              {bountyMarkdown}
            </pre>
          </div>
        </div>

        {/* Production Agent Code Exporter */}
        <div className="glass-surface rounded-2xl p-8 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-[#38BDF8]" aria-hidden="true" />
                <span className="text-xs uppercase tracking-wider text-[#38BDF8] tabular-nums">
                  Sanitized Agent Stream Code
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCodeLang('typescript')}
                  className={`px-3 py-1 rounded-full text-xs tabular-nums cursor-pointer ${
                    codeLang === 'typescript'
                      ? 'bg-[#38BDF8] text-[#070A12] font-semibold'
                      : 'bg-white/[0.04] text-[#A3B1C6]'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLang('python')}
                  className={`px-3 py-1 rounded-full text-xs tabular-nums cursor-pointer ${
                    codeLang === 'python'
                      ? 'bg-[#38BDF8] text-[#070A12] font-semibold'
                      : 'bg-white/[0.04] text-[#A3B1C6]'
                  }`}
                >
                  Python
                </button>
                <button
                  type="button"
                  id="copy-agent-code-btn"
                  onClick={() => copyText(agentExportSnippet, 'code')}
                  className="secondary-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs cursor-pointer"
                >
                  {copiedMode === 'code' ? (
                    <>
                      <Check
                        size={14}
                        className="text-[#34D399]"
                        aria-hidden="true"
                      />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre
              id="ledger-code-export-pre"
              className="rounded-xl bg-[#070A12]/90 border border-white/[0.07] p-5 text-xs text-[#F4F6FB] tabular-nums overflow-x-auto leading-relaxed"
            >
              {agentExportSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* Saved Run History List */}
      <section className="glass-surface rounded-2xl p-8 md:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-[#A3B1C6] tabular-nums">
              Persistent Session &amp; Benchmark Archive
            </div>
            <h2 className="text-2xl font-bold text-[#F4F6FB] font-display">
              All Recorded Verification Runs ({runs.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-white/[0.08]">
          {runs.map((r) => {
            const isSelected = r.id === activeRun.id;
            return (
              <div
                key={r.id}
                className="py-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs tabular-nums">
                    <span className="font-bold text-[#F08C4B]">{r.id}</span>
                    <span className="text-[#76869E]">·</span>
                    <span className="text-[#A3B1C6]">
                      {r.voiceId} ({r.language})
                    </span>
                    <span className="text-[#76869E]">·</span>
                    <span className="text-[#76869E]">
                      X-Request-Id: {r.requestId}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-[#F4F6FB]">
                    {r.title}
                  </div>
                  <div className="text-sm text-[#A3B1C6]">
                    {r.bountyFinding}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums ${
                      r.verdict === 'PASS'
                        ? 'bg-[#34D399]/15 text-[#34D399]'
                        : 'bg-[#FB7185]/15 text-[#FB7185]'
                    }`}
                  >
                    {r.verdict} · {r.accuracyPercent}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveRunById(r.id)}
                    className={
                      isSelected
                        ? 'copper-pill-btn px-4 py-2 rounded-full text-xs cursor-pointer'
                        : 'secondary-pill-btn px-4 py-2 rounded-full text-xs cursor-pointer'
                    }
                  >
                    {isSelected ? 'Selected' : 'Load Packet'}
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
