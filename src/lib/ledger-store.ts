import fs from 'fs';
import path from 'path';
import type { EntityMatchItem, WordBoundaryFrame } from './turnproof-engine';

export interface VerificationRunRecord {
  id: string;
  title: string;
  scenario: string;
  createdAt: string;
  voiceId: string;
  language: string;
  rawPrompt: string;
  compiledPrompt: string;
  synthesizedText: string;
  wasCompiled: boolean;
  requestId: string;
  serverTiming: string;
  billedCharacters: number;
  audioDurationMs: number;
  audioChunkCount: number;
  audioUrl: string;
  waveformPeaks: number[];
  wordBoundaries: WordBoundaryFrame[];
  transcriptId: string;
  sttTranscript: string;
  sttConfidence: number;
  verdict: 'PASS' | 'DRIFT' | 'FAIL';
  accuracyPercent: number;
  entities: EntityMatchItem[];
  leakedBracketWords: string[];
  bountyFinding: string;
}

const RUNTIME_STORE_PATH = '/tmp/turnproof-ledger-runs.json';

function loadSeedRuns(): VerificationRunRecord[] {
  try {
    const seedPath = path.join(process.cwd(), 'src', 'data', 'seed-runs.json');
    if (fs.existsSync(seedPath)) {
      const raw = fs.readFileSync(seedPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback if seed file is still being generated
  }
  return [];
}

export function getLedgerRuns(): VerificationRunRecord[] {
  const seeds = loadSeedRuns();
  try {
    if (fs.existsSync(RUNTIME_STORE_PATH)) {
      const customRaw = fs.readFileSync(RUNTIME_STORE_PATH, 'utf-8');
      const customRuns = JSON.parse(customRaw) as VerificationRunRecord[];
      if (Array.isArray(customRuns)) {
        const existingIds = new Set(customRuns.map((r) => r.id));
        return [
          ...customRuns,
          ...seeds.filter((s) => !existingIds.has(s.id)),
        ];
      }
    }
  } catch {
    // Ignore runtime read error
  }
  return seeds;
}

export function appendLedgerRun(
  run: VerificationRunRecord
): VerificationRunRecord[] {
  let customRuns: VerificationRunRecord[] = [];
  try {
    if (fs.existsSync(RUNTIME_STORE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(RUNTIME_STORE_PATH, 'utf-8'));
      if (Array.isArray(parsed)) customRuns = parsed;
    }
  } catch {
    customRuns = [];
  }

  const filtered = customRuns.filter((r) => r.id !== run.id);
  const updated = [run, ...filtered].slice(0, 50);

  try {
    fs.writeFileSync(RUNTIME_STORE_PATH, JSON.stringify(updated, null, 2));
  } catch {
    // Ignore write failure if /tmp is full
  }

  return getLedgerRuns();
}
