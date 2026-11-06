import fs from 'fs';
import path from 'path';
import {
  encodePcm16ToWavBuffer,
  type WordBoundaryFrame,
} from './turnproof-engine';

export interface TtsSynthesisResult {
  requestId: string;
  serverTiming: string;
  billedCharacters: number;
  sampleRate: number;
  voiceId: string;
  language: string;
  audioDurationMs: number;
  wordBoundariesStatus: string;
  wordBoundaries: WordBoundaryFrame[];
  audioChunkCount: number;
  waveformPeaks: number[];
  wavBase64: string;
  wavBuffer: Buffer;
}

export interface SttVerificationResult {
  transcriptId: string;
  transcriptText: string;
  confidence: number;
  audioDurationSeconds: number;
  words: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

/**
 * Resolves the AssemblyAI API key safely on the server without ever exposing it to the client.
 * Priority:
 * 1. Explicit header (`x-assemblyai-key`) from client BYOK modal
 * 2. Environment variable (`process.env.ASSEMBLYAI_API_KEY`)
 * 3. Local workspace key file (`/home/antigravity/assemble_api_key.txt`) when running in local dev
 */
export function resolveAssemblyAiApiKey(headerKey?: string | null): string | null {
  if (headerKey && headerKey.trim().length > 8) {
    return headerKey.trim();
  }
  if (
    process.env.ASSEMBLYAI_API_KEY &&
    process.env.ASSEMBLYAI_API_KEY.trim().length > 8
  ) {
    return process.env.ASSEMBLYAI_API_KEY.trim();
  }
  try {
    const localKeyPath = '/home/antigravity/assemble_api_key.txt';
    if (fs.existsSync(localKeyPath)) {
      const raw = fs.readFileSync(localKeyPath, 'utf-8').trim();
      if (raw.length > 8) return raw;
    }
  } catch {
    // Ignore filesystem errors on serverless platforms
  }
  return null;
}

/**
 * Computes 72 normalized amplitude peaks (0.08 to 1.0) directly from 16-bit signed little-endian PCM bytes.
 */
export function computePcmWaveformPeaks(
  base64Chunks: string[],
  barCount = 72
): number[] {
  const pcm = Buffer.concat(base64Chunks.map((c) => Buffer.from(c, 'base64')));
  const totalSamples = Math.floor(pcm.length / 2);
  if (totalSamples === 0) {
    return Array.from({ length: barCount }, () => 0.15);
  }

  const samplesPerBar = Math.max(1, Math.floor(totalSamples / barCount));
  const rawPeaks: number[] = [];
  let maxPeak = 1;

  for (let b = 0; b < barCount; b++) {
    const startSample = b * samplesPerBar;
    const endSample = Math.min(totalSamples, startSample + samplesPerBar);
    let sumSq = 0;
    let count = 0;
    for (let s = startSample; s < endSample; s += 4) {
      const sample = pcm.readInt16LE(s * 2);
      sumSq += sample * sample;
      count += 1;
    }
    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    if (rms > maxPeak) maxPeak = rms;
    rawPeaks.push(rms);
  }

  return rawPeaks.map((p) => {
    const norm = p / maxPeak;
    return Number(Math.max(0.08, Math.min(1, norm)).toFixed(3));
  });
}

/**
 * Calls AssemblyAI's real `POST https://tts.us.assemblyai.com/v1/speech/events` SSE endpoint,
 * collects `Begin`, `Audio`, `FlushDone`, `WordBoundaries`, and `Termination` frames,
 * and packages a 24 kHz mono WAV buffer + real acoustic waveform peaks.
 */
export async function synthesizeWithAssemblyAiTts(params: {
  text: string;
  voiceId?: string;
  language?: string;
  apiKey: string;
}): Promise<TtsSynthesisResult> {
  const voiceId = params.voiceId || 'aai-jane';
  const language = params.language || 'english';

  const response = await fetch('https://tts.us.assemblyai.com/v1/speech/events', {
    method: 'POST',
    headers: {
      Authorization: params.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: params.text,
      voice_id: voiceId,
      model: 'assemblyai-tts-1',
      language,
      sample_rate: 24000,
      encoding: 'pcm_s16le',
      word_boundaries: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `AssemblyAI TTS failed (${response.status}): ${errText.slice(0, 300)}`
    );
  }

  const requestId = response.headers.get('x-request-id') || 'unknown-req-id';
  const serverTiming =
    response.headers.get('server-timing') || 'open;dur=0, model;dur=0, ttfa;dur=0';
  const headerBilled = Number(
    response.headers.get('x-tts-billed-characters') || params.text.length
  );

  const rawSse = await response.text();
  const lines = rawSse.split(/\r?\n/);

  const audioChunks: string[] = [];
  const wordBoundaries: WordBoundaryFrame[] = [];
  let audioDurationMs = 0;
  let billedCharacters = headerBilled;
  let wordBoundariesStatus = 'complete';

  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const jsonStr = line.slice(5).trim();
    if (!jsonStr) continue;
    try {
      const payload = JSON.parse(jsonStr);
      if (payload.type === 'Audio' && typeof payload.audio === 'string') {
        audioChunks.push(payload.audio);
      } else if (
        payload.type === 'FlushDone' &&
        typeof payload.audio_duration_ms === 'number'
      ) {
        audioDurationMs = payload.audio_duration_ms;
      } else if (
        payload.type === 'WordBoundaries' &&
        Array.isArray(payload.words)
      ) {
        for (const w of payload.words) {
          wordBoundaries.push({
            word: String(w.word),
            start: Number(w.start),
            end: Number(w.end),
            confidence: Number(Number(w.confidence ?? 0.95).toFixed(3)),
          });
        }
      } else if (payload.type === 'Termination') {
        if (typeof payload.billed_characters === 'number') {
          billedCharacters = payload.billed_characters;
        }
        if (typeof payload.word_boundaries_status === 'string') {
          wordBoundariesStatus = payload.word_boundaries_status;
        }
        if (!audioDurationMs && typeof payload.audio_duration_seconds === 'number') {
          audioDurationMs = Math.round(payload.audio_duration_seconds * 1000);
        }
      }
    } catch {
      // Skip malformed SSE line
    }
  }

  const wavBuffer = encodePcm16ToWavBuffer(audioChunks, 24000);
  const waveformPeaks = computePcmWaveformPeaks(audioChunks, 72);

  return {
    requestId,
    serverTiming,
    billedCharacters,
    sampleRate: 24000,
    voiceId,
    language,
    audioDurationMs,
    wordBoundariesStatus,
    wordBoundaries,
    audioChunkCount: audioChunks.length,
    waveformPeaks,
    wavBase64: wavBuffer.toString('base64'),
    wavBuffer,
  };
}

/**
 * Uploads a 24 kHz WAV buffer to AssemblyAI (`POST /v2/upload`) and transcribes it
 * with `Universal-3.5 Pro` (`speech_models: ["universal-3-5-pro"]`) to verify exact entity readback.
 */
export async function verifyAudioWithUniversal35Pro(params: {
  wavBuffer: Buffer;
  apiKey: string;
  language?: string;
}): Promise<SttVerificationResult> {
  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      Authorization: params.apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: new Uint8Array(params.wavBuffer),
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`STT upload failed (${uploadRes.status}): ${errText}`);
  }

  const { upload_url } = (await uploadRes.json()) as { upload_url: string };

  const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      Authorization: params.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      speech_models: ['universal-3-5-pro'],
      ...(params.language && params.language !== 'english'
        ? { language_detection: true }
        : {}),
    }),
  });

  if (!transcriptRes.ok) {
    const errText = await transcriptRes.text();
    throw new Error(
      `STT transcript creation failed (${transcriptRes.status}): ${errText}`
    );
  }

  const created = (await transcriptRes.json()) as { id: string };
  const transcriptId = created.id;

  // Poll up to 25 times (approx 15 seconds max)
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((r) => setTimeout(r, 650));
    const pollRes = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: { Authorization: params.apiKey },
      }
    );
    if (!pollRes.ok) continue;
    const data = await pollRes.json();
    if (data.status === 'completed') {
      return {
        transcriptId,
        transcriptText: String(data.text || ''),
        confidence: Number(Number(data.confidence ?? 0.98).toFixed(3)),
        audioDurationSeconds: Number(data.audio_duration ?? 0),
        words: Array.isArray(data.words)
          ? data.words.map((w: Record<string, unknown>) => ({
              text: String(w.text || ''),
              start: Number(w.start || 0),
              end: Number(w.end || 0),
              confidence: Number(w.confidence || 0.95),
            }))
          : [],
      };
    }
    if (data.status === 'error') {
      throw new Error(`Universal-3.5 Pro transcription error: ${data.error}`);
    }
  }

  throw new Error('Universal-3.5 Pro transcription timed out');
}
