'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Scissors,
  SkipBack,
  SkipForward,
} from '@phosphor-icons/react';
import type { WordBoundaryFrame } from '@/lib/turnproof-engine';

interface WaveformScissorProps {
  idPrefix?: string;
  audioUrl: string;
  durationMs: number;
  waveformPeaks: number[];
  wordBoundaries: WordBoundaryFrame[];
  cutMs: number;
  onChangeCutMs: (ms: number) => void;
  interactive?: boolean;
}

export function WaveformScissor({
  idPrefix = 'scissor',
  audioUrl,
  durationMs,
  waveformPeaks,
  wordBoundaries,
  cutMs,
  onChangeCutMs,
  interactive = true,
}: WaveformScissorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<'full' | 'sliced'>('sliced');
  const [playheadMs, setPlayheadMs] = useState(0);

  const safeDuration = Math.max(1000, durationMs || 10000);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const peaks =
      waveformPeaks && waveformPeaks.length > 0
        ? waveformPeaks
        : Array.from({ length: 72 }, (_, i) =>
            Number(
              (
                Math.sin(i * 0.35) * 0.3 +
                Math.cos(i * 0.19) * 0.25 +
                0.45
              ).toFixed(3)
            )
          );

    const bars = peaks.length;
    const barWidth = 6;
    const gap = (W - bars * barWidth) / Math.max(1, bars - 1);

    for (let i = 0; i < bars; i++) {
      const x = i * (barWidth + gap);
      const barMs = (x / W) * safeDuration;
      const amp = Math.max(0.1, Math.min(1, peaks[i] || 0.2));
      const barH = Math.max(10, amp * (H - 22));
      const y = (H - barH) / 2;

      if (barMs <= cutMs) {
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, '#F08C4B');
        grad.addColorStop(1, '#38BDF8');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = 'rgba(118, 134, 158, 0.22)';
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 3);
      ctx.fill();
    }

    // Active playback cursor (Wave Cyan)
    if (isPlaying && playheadMs > 0) {
      const playX = Math.min(W, Math.max(0, (playheadMs / safeDuration) * W));
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, H);
      ctx.stroke();
    }

    // Sculptural Barge-In Cut-Line (Burnished Copper)
    const cutX = Math.min(W - 2, Math.max(2, (cutMs / safeDuration) * W));
    ctx.strokeStyle = '#F08C4B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cutX, 0);
    ctx.lineTo(cutX, H);
    ctx.stroke();
  }, [waveformPeaks, safeDuration, cutMs, isPlaying, playheadMs]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setPlayheadMs(0);
  }, []);

  const startPlayback = (mode: 'full' | 'sliced') => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && playMode === mode) {
      stopAudio();
      return;
    }

    setPlayMode(mode);
    audio.currentTime = 0;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        const tick = () => {
          if (!audioRef.current) return;
          const currentMs = audioRef.current.currentTime * 1000;
          setPlayheadMs(currentMs);
          if (mode === 'sliced' && currentMs >= cutMs) {
            stopAudio();
            return;
          }
          if (!audioRef.current.paused) {
            rafRef.current = requestAnimationFrame(tick);
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        setIsPlaying(false);
      });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    onChangeCutMs(Math.round(ratio * safeDuration));
  };

  const stepCut = (delta: number) => {
    const next = Math.max(0, Math.min(safeDuration, cutMs + delta));
    onChangeCutMs(next);
  };

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => {
          setIsPlaying(false);
          setPlayheadMs(0);
        }}
        preload="metadata"
      />

      {/* Top Transport & Millisecond Step Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            id={`${idPrefix}-play-sliced-audio-btn`}
            onClick={() => startPlayback('sliced')}
            className="copper-pill-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm cursor-pointer"
          >
            {isPlaying && playMode === 'sliced' ? (
              <Pause size={16} weight="fill" aria-hidden="true" />
            ) : (
              <Scissors size={16} weight="bold" aria-hidden="true" />
            )}
            <span>
              {isPlaying && playMode === 'sliced'
                ? 'Stop Barge-In Preview'
                : `Hear Up To Cut (${cutMs.toLocaleString()} ms)`}
            </span>
          </button>

          <button
            type="button"
            id={`${idPrefix}-play-full-audio-btn`}
            onClick={() => startPlayback('full')}
            className="secondary-pill-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm cursor-pointer"
          >
            {isPlaying && playMode === 'full' ? (
              <Pause size={16} weight="fill" aria-hidden="true" />
            ) : (
              <Play size={16} weight="fill" aria-hidden="true" />
            )}
            <span>
              {isPlaying && playMode === 'full'
                ? 'Pause Full Stream'
                : 'Play Full 24 kHz Turn'}
            </span>
          </button>
        </div>

        {interactive && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id={`${idPrefix}-step-cut-back-btn`}
              onClick={() => stepCut(-250)}
              aria-label="Step barge-in cut back by 250 milliseconds"
              className="secondary-pill-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs tabular-nums cursor-pointer"
            >
              <SkipBack size={14} aria-hidden="true" />
              <span>-250 ms</span>
            </button>

            <div
              id={`${idPrefix}-active-cut-ms-readout`}
              className="px-4 py-2 rounded-full bg-[#F08C4B]/15 border border-[#F08C4B]/60 text-xs font-bold text-[#F08C4B] tabular-nums"
            >
              Cut @ {cutMs.toLocaleString()} ms
            </div>

            <button
              type="button"
              id={`${idPrefix}-step-cut-forward-btn`}
              onClick={() => stepCut(250)}
              aria-label="Step barge-in cut forward by 250 milliseconds"
              className="secondary-pill-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs tabular-nums cursor-pointer"
            >
              <span>+250 ms</span>
              <SkipForward size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Sculptural Canvas Waveform Surface */}
      <div className="rounded-2xl bg-[#070A12]/90 border border-white/[0.07] p-6 space-y-4">
        <canvas
          ref={canvasRef}
          width={960}
          height={128}
          onClick={handleCanvasClick}
          aria-label="24 kHz PCM waveform amplitude envelope and millisecond barge-in cut line"
          className={`w-full h-[120px] block ${
            interactive ? 'cursor-pointer' : ''
          }`}
        />

        {interactive && (
          <div className="space-y-2">
            <label
              htmlFor={`${idPrefix}-barge-in-range-slider`}
              className="sr-only"
            >
              Caller Barge-In Interrupt Timestamp in Milliseconds
            </label>
            <input
              id={`${idPrefix}-barge-in-range-slider`}
              type="range"
              min={0}
              max={safeDuration}
              step={20}
              value={Math.min(safeDuration, cutMs)}
              onChange={(e) => onChangeCutMs(Number(e.target.value))}
              className="w-full h-2 cursor-pointer"
            />
          </div>
        )}

        <div className="flex justify-between text-xs text-[#76869E] tabular-nums">
          <span>0 ms (Begin)</span>
          <span>{Math.round(safeDuration * 0.25).toLocaleString()} ms</span>
          <span>{Math.round(safeDuration * 0.5).toLocaleString()} ms</span>
          <span>{Math.round(safeDuration * 0.75).toLocaleString()} ms</span>
          <span>{safeDuration.toLocaleString()} ms (FlushDone)</span>
        </div>
      </div>

      {/* WordBoundaries Token Ribbon */}
      {wordBoundaries.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#A3B1C6] tabular-nums">
            <span>
              Click any <code className="text-[#38BDF8]">WordBoundaries</code>{' '}
              token to snap the interrupt cut-line to the end of that word:
            </span>
            <span>{wordBoundaries.length} word frames</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {wordBoundaries.map((w, idx) => {
              const isSpoken = w.start < cutMs;
              return (
                <button
                  key={`${w.word}-${w.start}-${idx}`}
                  type="button"
                  onClick={() => interactive && onChangeCutMs(w.end)}
                  className={
                    isSpoken
                      ? 'px-3.5 py-1.5 rounded-full bg-[#F08C4B]/15 border border-[#F08C4B]/50 text-sm text-[#F4F6FB] font-medium tabular-nums hover:border-[#F08C4B] transition-colors cursor-pointer'
                      : 'px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.06] text-sm text-[#76869E] line-through tabular-nums hover:border-white/20 transition-colors cursor-pointer'
                  }
                >
                  <span>{w.word}</span>
                  <span className="text-xs opacity-65 ml-1.5">{w.start}ms</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
