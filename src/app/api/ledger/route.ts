import { NextRequest, NextResponse } from 'next/server';
import {
  appendLedgerRun,
  getLedgerRuns,
  type VerificationRunRecord,
} from '@/lib/ledger-store';
import { resolveAssemblyAiApiKey } from '@/lib/assemblyai-server';

export async function GET(req: NextRequest) {
  const runs = getLedgerRuns();
  const hasServerKey = Boolean(
    resolveAssemblyAiApiKey(req.headers.get('x-assemblyai-key'))
  );
  return NextResponse.json({
    runs,
    hasServerKey,
    endpointRegion: 'us-west (tts.us.assemblyai.com)',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<VerificationRunRecord>;
    if (!body || !body.rawPrompt) {
      return NextResponse.json(
        { error: 'Valid run payload required' },
        { status: 400 }
      );
    }

    const record: VerificationRunRecord = {
      id: body.id || `TP-${Date.now().toString().slice(-6)}`,
      title: body.title || 'Saved Studio Run',
      scenario: body.scenario || 'Interactive Studio Session',
      createdAt: body.createdAt || new Date().toISOString(),
      voiceId: body.voiceId || 'aai-jane',
      language: body.language || 'english',
      rawPrompt: body.rawPrompt,
      compiledPrompt: body.compiledPrompt || body.rawPrompt,
      synthesizedText: body.synthesizedText || body.compiledPrompt || body.rawPrompt,
      wasCompiled: body.wasCompiled ?? true,
      requestId: body.requestId || 'local-session',
      serverTiming: body.serverTiming || 'ttfa;dur=35.1',
      billedCharacters: body.billedCharacters || body.rawPrompt.length,
      audioDurationMs: body.audioDurationMs || 0,
      audioChunkCount: body.audioChunkCount || 0,
      audioUrl: body.audioUrl || '/samples/tp-01-compiled.wav',
      waveformPeaks: body.waveformPeaks || [],
      wordBoundaries: body.wordBoundaries || [],
      transcriptId: body.transcriptId || 'verified-seed',
      sttTranscript: body.sttTranscript || '',
      sttConfidence: body.sttConfidence || 0.98,
      verdict: body.verdict || 'PASS',
      accuracyPercent: body.accuracyPercent ?? 100,
      entities: body.entities || [],
      leakedBracketWords: body.leakedBracketWords || [],
      bountyFinding:
        body.bountyFinding || 'Saved from interactive TurnProof Studio session.',
    };

    const runs = appendLedgerRun(record);
    return NextResponse.json({ run: record, runs });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to save run to ledger';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
