import { NextRequest, NextResponse } from 'next/server';
import {
  resolveAssemblyAiApiKey,
  synthesizeWithAssemblyAiTts,
  verifyAudioWithUniversal35Pro,
} from '@/lib/assemblyai-server';
import {
  compileVoiceTurnPrompt,
  gradeRoundTripEntities,
} from '@/lib/turnproof-engine';
import { appendLedgerRun, type VerificationRunRecord } from '@/lib/ledger-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPrompt = String(body.rawPrompt || body.text || '').trim();
    const title = String(body.title || 'Live Turn Verification Run').trim();
    const scenario = String(body.scenario || 'Custom Voice Agent Turn').trim();
    const voiceId = String(body.voiceId || 'aai-jane');
    const language = String(body.language || 'english');
    const useCompiled = body.useCompiled !== false;

    if (!rawPrompt) {
      return NextResponse.json(
        { error: 'rawPrompt is required for round-trip verification.' },
        { status: 400 }
      );
    }

    const apiKey = resolveAssemblyAiApiKey(req.headers.get('x-assemblyai-key'));
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No AssemblyAI API key found. Add your key in the top bar API Key drawer or set ASSEMBLYAI_API_KEY.',
        },
        { status: 401 }
      );
    }

    const compiled = compileVoiceTurnPrompt(rawPrompt);
    const synthesizedText = useCompiled ? compiled.compiledText : rawPrompt;

    const tts = await synthesizeWithAssemblyAiTts({
      text: synthesizedText,
      voiceId,
      language,
      apiKey,
    });

    const stt = await verifyAudioWithUniversal35Pro({
      wavBuffer: tts.wavBuffer,
      apiKey,
      language,
    });

    const grade = gradeRoundTripEntities(rawPrompt, stt.transcriptText, true);

    const record: VerificationRunRecord = {
      id: `TP-${Date.now().toString().slice(-6)}`,
      title,
      scenario,
      createdAt: new Date().toISOString(),
      voiceId,
      language,
      rawPrompt,
      compiledPrompt: compiled.compiledText,
      synthesizedText,
      wasCompiled: useCompiled,
      requestId: tts.requestId,
      serverTiming: tts.serverTiming,
      billedCharacters: tts.billedCharacters,
      audioDurationMs: tts.audioDurationMs,
      audioChunkCount: tts.audioChunkCount,
      audioUrl: `data:audio/wav;base64,${tts.wavBase64}`,
      waveformPeaks: tts.waveformPeaks,
      wordBoundaries: tts.wordBoundaries,
      transcriptId: stt.transcriptId,
      sttTranscript: stt.transcriptText,
      sttConfidence: stt.confidence,
      verdict: grade.verdict,
      accuracyPercent: grade.accuracyPercent,
      entities: grade.entities,
      leakedBracketWords: grade.leakedBracketWords,
      bountyFinding: grade.summary,
    };

    appendLedgerRun(record);

    return NextResponse.json({
      run: record,
      compiled,
      grade,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Round-trip verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
