'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import seedRunsJson from '@/data/seed-runs.json';
import type { VerificationRunRecord } from '@/lib/ledger-store';
import {
  compileVoiceTurnPrompt,
  type CompiledTurnResult,
} from '@/lib/turnproof-engine';

const INITIAL_RUNS = seedRunsJson as VerificationRunRecord[];

export interface TurnProofContextValue {
  runs: VerificationRunRecord[];
  activeRun: VerificationRunRecord;
  setActiveRunById: (id: string) => void;
  updateActiveRun: (run: VerificationRunRecord) => void;
  draftText: string;
  setDraftText: (text: string) => void;
  voiceId: string;
  setVoiceId: (v: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  bargeInCutMs: number;
  setBargeInCutMs: (ms: number) => void;
  compiledDraft: CompiledTurnResult;
  clientApiKey: string;
  setClientApiKey: (key: string) => void;
  hasServerKey: boolean;
  isSynthesizing: boolean;
  isVerifying: boolean;
  statusBanner: { type: 'info' | 'success' | 'error'; message: string } | null;
  clearStatusBanner: () => void;
  synthesizeLiveTurn: (useCompiled?: boolean) => Promise<void>;
  runRoundTripVerification: (opts?: {
    rawPrompt?: string;
    title?: string;
    scenario?: string;
    voiceId?: string;
    language?: string;
    useCompiled?: boolean;
  }) => Promise<VerificationRunRecord | null>;
}

const TurnProofContext = createContext<TurnProofContextValue | null>(null);

export function TurnProofProvider({ children }: { children: React.ReactNode }) {
  const [runs, setRuns] = useState<VerificationRunRecord[]>(INITIAL_RUNS);
  const [activeRun, setActiveRun] = useState<VerificationRunRecord>(
    INITIAL_RUNS[0]
  );
  const [draftText, setDraftText] = useState<string>(
    INITIAL_RUNS[0]?.rawPrompt ||
      '[pause] Thanks for calling Alliance Appliance Repair! Your booking code is 493A, confirmed for $12.50 at 2:15 PM.'
  );
  const [voiceId, setVoiceId] = useState<string>(
    INITIAL_RUNS[0]?.voiceId || 'aai-jane'
  );
  const [language, setLanguage] = useState<string>(
    INITIAL_RUNS[0]?.language || 'english'
  );
  const [bargeInCutMs, setBargeInCutMs] = useState<number>(4620);
  const [clientApiKey, setClientApiKeyState] = useState<string>('');
  const [hasServerKey, setHasServerKey] = useState<boolean>(true);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  const compiledDraft = React.useMemo(
    () => compileVoiceTurnPrompt(draftText),
    [draftText]
  );

  useEffect(() => {
    try {
      const savedKey = window.localStorage.getItem('turnproof_aai_key') || '';
      if (savedKey) setClientApiKeyState(savedKey);
    } catch {
      // Ignore storage error
    }

    fetch('/api/ledger')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.runs) && data.runs.length > 0) {
          setRuns(data.runs);
        }
        if (typeof data.hasServerKey === 'boolean') {
          setHasServerKey(data.hasServerKey);
        }
      })
      .catch(() => {
        // Keep initial seed runs on offline fallback
      });
  }, []);

  const setClientApiKey = (key: string) => {
    setClientApiKeyState(key);
    try {
      if (key.trim()) {
        window.localStorage.setItem('turnproof_aai_key', key.trim());
      } else {
        window.localStorage.removeItem('turnproof_aai_key');
      }
    } catch {
      // Ignore storage error
    }
  };

  const setActiveRunById = (id: string) => {
    const found = runs.find((r) => r.id === id);
    if (found) {
      setActiveRun(found);
      setDraftText(found.rawPrompt);
      setVoiceId(found.voiceId);
      setLanguage(found.language);
      setBargeInCutMs(
        Math.min(4620, Math.max(500, Math.round(found.audioDurationMs * 0.45)))
      );
    }
  };

  const updateActiveRun = (run: VerificationRunRecord) => {
    setActiveRun(run);
    setRuns((prev) => [run, ...prev.filter((r) => r.id !== run.id)]);
  };

  const clearStatusBanner = () => setStatusBanner(null);

  const synthesizeLiveTurn = async (useCompiled = true) => {
    setIsSynthesizing(true);
    setStatusBanner({
      type: 'info',
      message:
        'Streaming 24 kHz pcm_s16le audio and WordBoundaries from POST /v1/speech/events...',
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (clientApiKey.trim()) {
        headers['x-assemblyai-key'] = clientApiKey.trim();
      }

      const res = await fetch('/api/tts/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: draftText,
          voiceId,
          language,
          useCompiled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: 'error',
          message: data.error || 'TTS synthesis failed.',
        });
        return;
      }

      const updatedRun: VerificationRunRecord = {
        ...activeRun,
        id: `TP-LIVE-${Date.now().toString().slice(-4)}`,
        title: useCompiled
          ? 'Live Compiled Studio Synthesis'
          : 'Live Raw Uncompiled Synthesis',
        scenario: 'Interactive Studio Stream',
        createdAt: new Date().toISOString(),
        voiceId: data.voiceId,
        language: data.language,
        rawPrompt: draftText,
        compiledPrompt: data.compiled.compiledText,
        synthesizedText: data.synthesizedText,
        wasCompiled: useCompiled,
        requestId: data.requestId,
        serverTiming: data.serverTiming,
        billedCharacters: data.billedCharacters,
        audioDurationMs: data.audioDurationMs,
        audioChunkCount: data.audioChunkCount,
        audioUrl: data.audioDataUri,
        waveformPeaks: data.waveformPeaks,
        wordBoundaries: data.wordBoundaries,
      };

      updateActiveRun(updatedRun);
      setBargeInCutMs(
        Math.min(4500, Math.max(400, Math.round(data.audioDurationMs * 0.45)))
      );
      setStatusBanner({
        type: 'success',
        message: `Synthesized ${data.audioChunkCount} PCM frames (${data.wordBoundaries.length} WordBoundaries) · X-Request-Id: ${data.requestId.slice(0, 12)}...`,
      });
    } catch (err: unknown) {
      setStatusBanner({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Network error during TTS stream.',
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  const runRoundTripVerification = async (opts?: {
    rawPrompt?: string;
    title?: string;
    scenario?: string;
    voiceId?: string;
    language?: string;
    useCompiled?: boolean;
  }): Promise<VerificationRunRecord | null> => {
    setIsVerifying(true);
    setStatusBanner({
      type: 'info',
      message:
        'Running round-trip verification: assemblyai-tts-1 (24 kHz WAV) -> Universal-3.5 Pro STT...',
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (clientApiKey.trim()) {
        headers['x-assemblyai-key'] = clientApiKey.trim();
      }

      const res = await fetch('/api/verify/roundtrip', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rawPrompt: opts?.rawPrompt ?? draftText,
          title: opts?.title ?? 'Live Round-Trip Verification',
          scenario: opts?.scenario ?? 'Studio Entity Readback Check',
          voiceId: opts?.voiceId ?? voiceId,
          language: opts?.language ?? language,
          useCompiled: opts?.useCompiled ?? true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: 'error',
          message: data.error || 'Round-trip verification failed.',
        });
        return null;
      }

      const verifiedRun = data.run as VerificationRunRecord;
      updateActiveRun(verifiedRun);
      setStatusBanner({
        type: verifiedRun.verdict === 'PASS' ? 'success' : 'error',
        message: `Round-trip verdict: ${verifiedRun.verdict} (${verifiedRun.accuracyPercent}% entity match) · Universal-3.5 Pro transcript: "${verifiedRun.sttTranscript}"`,
      });
      return verifiedRun;
    } catch (err: unknown) {
      setStatusBanner({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Network error during round-trip verification.',
      });
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <TurnProofContext.Provider
      value={{
        runs,
        activeRun,
        setActiveRunById,
        updateActiveRun,
        draftText,
        setDraftText,
        voiceId,
        setVoiceId,
        language,
        setLanguage,
        bargeInCutMs,
        setBargeInCutMs,
        compiledDraft,
        clientApiKey,
        setClientApiKey,
        hasServerKey,
        isSynthesizing,
        isVerifying,
        statusBanner,
        clearStatusBanner,
        synthesizeLiveTurn,
        runRoundTripVerification,
      }}
    >
      {children}
    </TurnProofContext.Provider>
  );
}

export function useTurnProof() {
  const ctx = useContext(TurnProofContext);
  if (!ctx) {
    throw new Error('useTurnProof must be used inside TurnProofProvider');
  }
  return ctx;
}
