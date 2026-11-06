import { NextRequest, NextResponse } from 'next/server';
import {
  resolveAssemblyAiApiKey,
  synthesizeWithAssemblyAiTts,
} from '@/lib/assemblyai-server';
import { compileVoiceTurnPrompt } from '@/lib/turnproof-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = String(body.text || '').trim();
    const voiceId = String(body.voiceId || 'aai-jane');
    const language = String(body.language || 'english');
    const useCompiled = body.useCompiled !== false;

    if (!rawText) {
      return NextResponse.json(
        { error: 'Turn script text is required.' },
        { status: 400 }
      );
    }

    const compiled = compileVoiceTurnPrompt(rawText);
    const targetText = useCompiled ? compiled.compiledText : rawText;

    const apiKey = resolveAssemblyAiApiKey(req.headers.get('x-assemblyai-key'));
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No AssemblyAI API key found. Add your key in the top bar API Key drawer or set ASSEMBLYAI_API_KEY.',
          compiled,
        },
        { status: 401 }
      );
    }

    const synthesis = await synthesizeWithAssemblyAiTts({
      text: targetText,
      voiceId,
      language,
      apiKey,
    });

    return NextResponse.json({
      compiled,
      synthesizedText: targetText,
      wasCompiled: useCompiled,
      requestId: synthesis.requestId,
      serverTiming: synthesis.serverTiming,
      billedCharacters: synthesis.billedCharacters,
      sampleRate: synthesis.sampleRate,
      voiceId: synthesis.voiceId,
      language: synthesis.language,
      audioDurationMs: synthesis.audioDurationMs,
      wordBoundariesStatus: synthesis.wordBoundariesStatus,
      wordBoundaries: synthesis.wordBoundaries,
      audioChunkCount: synthesis.audioChunkCount,
      waveformPeaks: synthesis.waveformPeaks,
      audioDataUri: `data:audio/wav;base64,${synthesis.wavBase64}`,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unexpected TTS synthesis error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
