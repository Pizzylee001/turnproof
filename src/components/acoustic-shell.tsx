'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Waveform,
  Scissors,
  ShieldCheck,
  Archive,
  FilmSlate,
  Key,
  CheckCircle,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { useTurnProof } from '@/context/turnproof-context';

const NAV_ITEMS = [
  { href: '/', label: '01. Stage', icon: Waveform },
  { href: '/studio', label: '02. Studio', icon: Scissors },
  { href: '/verify', label: '03. Verify', icon: ShieldCheck },
  { href: '/ledger', label: '04. Ledger', icon: Archive },
  { href: '/demo', label: '05. Demo', icon: FilmSlate },
];

export function AcousticShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    activeRun,
    clientApiKey,
    setClientApiKey,
    hasServerKey,
    statusBanner,
    clearStatusBanner,
  } = useTurnProof();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState(clientApiKey);

  const isKeyArmed = Boolean(clientApiKey.trim() || hasServerKey);

  const openKeyModal = () => {
    setTempKey(clientApiKey);
    setIsKeyModalOpen(true);
  };

  const saveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setClientApiKey(tempKey);
    setIsKeyModalOpen(false);
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between">
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#F08C4B] focus:text-[#070A12] focus:font-semibold"
      >
        Skip to main workspace
      </a>

      {/* N5 Floating Frosted-Glass Pill Navigation */}
      <div className="sticky top-5 z-30 px-4 pt-5 flex justify-center">
        <header className="glass-surface rounded-full px-3 py-2 flex flex-wrap items-center justify-between gap-2 md:gap-5 max-w-full">
          <Link
            href="/"
            id="brand-home-link"
            className="flex items-center gap-2.5 pl-3 pr-2 py-1 rounded-full hover:opacity-90 transition-opacity"
          >
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-full bg-[#F08C4B] shadow-[0_0_12px_#F08C4B]"
            />
            <span className="font-bold tracking-tight text-sm text-[#F4F6FB] font-display">
              TurnProof
            </span>
          </Link>

          <nav
            aria-label="Primary Workbench Navigation"
            className="flex flex-wrap items-center gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`nav-link-${item.href === '/' ? 'stage' : item.href.slice(1)}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={
                    isActive
                      ? 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#F08C4B] text-[#070A12] transition-colors'
                      : 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#A3B1C6] hover:text-[#F4F6FB] hover:bg-white/[0.04] transition-colors'
                  }
                >
                  <Icon
                    size={16}
                    weight={isActive ? 'bold' : 'regular'}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 pr-2 pl-2 border-l border-white/10">
            <button
              type="button"
              id="open-api-key-modal-btn"
              onClick={openKeyModal}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#F4F6FB] tabular-nums cursor-pointer transition-colors"
            >
              <Key size={14} className="text-[#F08C4B]" aria-hidden="true" />
              <span>{isKeyArmed ? 'API Armed' : 'Set API Key'}</span>
            </button>
          </div>
        </header>
      </div>

      {/* Live Status Toast / Banner */}
      {statusBanner && (
        <div
          role="status"
          aria-live="polite"
          className="max-w-6xl w-full mx-auto px-6 md:px-10 pt-6"
        >
          <div
            className={`rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 text-sm border ${
              statusBanner.type === 'error'
                ? 'bg-[#FB7185]/10 border-[#FB7185]/40 text-[#FB7185]'
                : statusBanner.type === 'success'
                ? 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]'
                : 'bg-[#38BDF8]/10 border-[#38BDF8]/40 text-[#38BDF8]'
            }`}
          >
            <div className="flex items-center gap-3">
              {statusBanner.type === 'error' ? (
                <WarningCircle size={18} weight="bold" aria-hidden="true" />
              ) : (
                <CheckCircle size={18} weight="bold" aria-hidden="true" />
              )}
              <span>{statusBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={clearStatusBanner}
              aria-label="Dismiss notification"
              className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Main Spacious Workspace (VISUAL_DENSITY: 4) */}
      <main
        id="main-workspace"
        className="max-w-6xl w-full mx-auto px-6 md:px-10 py-12 md:py-16 flex-1"
      >
        {children}
      </main>

      {/* Ft3 Minimal Single-Line Colophon Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 md:px-10 py-10 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-[#76869E] tabular-nums">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[#F4F6FB] font-medium">TurnProof</span>
          <span>·</span>
          <span>AssemblyAI-TTS-1 (24 kHz pcm_s16le) + Universal-3.5 Pro</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span>Active Run: {activeRun.id}</span>
          <span>·</span>
          <span className="text-[#A3B1C6]">{activeRun.serverTiming}</span>
        </div>
      </footer>

      {/* Optional BYOK API Key Modal */}
      {isKeyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-key-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <form
            onSubmit={saveKey}
            className="glass-surface rounded-2xl max-w-md w-full p-8 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2
                id="api-key-modal-title"
                className="text-xl font-bold text-[#F4F6FB] font-display"
              >
                AssemblyAI API Key Configuration
              </h2>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                aria-label="Close API Key modal"
                className="p-2 rounded-full hover:bg-white/10 text-[#A3B1C6] cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm text-[#A3B1C6] leading-relaxed">
              {hasServerKey
                ? 'A server-side AssemblyAI key is already armed for live synthesis and Universal-3.5 Pro verification. You can optionally override it with your own key for this browser session.'
                : 'Enter your AssemblyAI API key to run live synthesis and Universal-3.5 Pro round-trip verification from your browser.'}
            </p>

            <div className="space-y-2">
              <label
                htmlFor="assemblyai-key-input"
                className="block text-xs uppercase tracking-wider text-[#A3B1C6] tabular-nums"
              >
                AssemblyAI API Key (Optional Override)
              </label>
              <input
                id="assemblyai-key-input"
                type="password"
                autoComplete="off"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Paste AssemblyAI API key..."
                className="w-full rounded-xl bg-[#070A12] border border-white/15 px-4 py-3 text-sm text-[#F4F6FB] tabular-nums focus:outline-none focus:border-[#F08C4B]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="secondary-pill-btn px-5 py-2.5 rounded-full text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-api-key-btn"
                className="copper-pill-btn px-6 py-2.5 rounded-full text-sm cursor-pointer"
              >
                Save Key
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
