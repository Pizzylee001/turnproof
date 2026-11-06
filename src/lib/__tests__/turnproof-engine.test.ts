import { describe, it, expect } from 'vitest';
import {
  compileVoiceTurnPrompt,
  sliceBargeInTurn,
  encodePcm16ToWavBuffer,
  gradeRoundTripEntities,
  buildBugBountyMarkdown,
  type WordBoundaryFrame,
} from '../turnproof-engine';

describe('TurnProof Protocol Engine (TDD)', () => {
  it('strips spoken bracket stage tags and formats alphanumeric codes for assemblyai-tts-1', () => {
    const raw =
      '[pause] Thanks for calling Alliance Appliance Repair! Your booking code is 493A, confirmed for $12.50 at 2:15 PM.';
    const res = compileVoiceTurnPrompt(raw);

    expect(res.compiledText).not.toContain('[pause]');
    expect(res.compiledText).not.toContain('(pause)');
    expect(res.compiledText).toContain('4-9-3-A');
    expect(res.hazards.some((h) => h.kind === 'bracket_tag')).toBe(true);
    expect(res.hazards.some((h) => h.kind === 'alphanumeric_code')).toBe(true);
    expect(res.requiresFirstSentenceFlush).toBe(true);
  });

  it('flags opening sentence < 50 chars as requiring an explicit WebSocket Flush', () => {
    const shortTurn = 'Hello there. How can I help you with your order today?';
    const res = compileVoiceTurnPrompt(shortTurn);
    expect(res.firstSentenceLength).toBeLessThan(50);
    expect(res.requiresFirstSentenceFlush).toBe(true);
  });

  it('slices spoken vs unheard words at an exact millisecond barge-in timestamp and tracks withheld entities', () => {
    const words: WordBoundaryFrame[] = [
      { word: 'Thanks', start: 274, end: 451, confidence: 0.82 },
      { word: 'for', start: 514, end: 641, confidence: 0.96 },
      { word: 'calling.', start: 704, end: 981, confidence: 0.95 },
      { word: 'Code', start: 3820, end: 4150, confidence: 0.99 },
      { word: 'is', start: 4210, end: 4480, confidence: 0.97 },
      { word: '4-9-3-A', start: 4650, end: 6120, confidence: 0.89 },
      { word: 'for', start: 6940, end: 7180, confidence: 0.98 },
      { word: '$12.50', start: 7250, end: 8190, confidence: 0.94 },
    ];

    const sliced = sliceBargeInTurn(words, 4500);
    expect(sliced.heardWords.map((w) => w.word)).toEqual([
      'Thanks',
      'for',
      'calling.',
      'Code',
      'is',
    ]);
    expect(sliced.cutWords.map((w) => w.word)).toEqual([
      '4-9-3-A',
      'for',
      '$12.50',
    ]);
    expect(sliced.heardText).toBe('Thanks for calling. Code is--');
    expect(sliced.withheldEntities).toContain('493A');
    expect(sliced.withheldEntities).toContain('$12.50');
    expect(sliced.patchedAssistantMessage.role).toBe('assistant');
    expect(sliced.patchedAssistantMessage.content).toBe(
      'Thanks for calling. Code is--'
    );
  });

  it('encodes base64 24kHz pcm_s16le chunks into a valid RIFF WAVE buffer', () => {
    const rawPcm = Buffer.alloc(480, 0);
    rawPcm.writeInt16LE(12000, 0);
    const chunkBase64 = rawPcm.toString('base64');

    const wav = encodePcm16ToWavBuffer([chunkBase64], 24000);
    expect(wav.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(wav.subarray(8, 12).toString('ascii')).toBe('WAVE');
    expect(wav.readUInt32LE(24)).toBe(24000);
    expect(wav.length).toBe(44 + 480);
  });

  it('grades round-trip Universal-3.5 Pro STT readback against target entities and detects leaked bracket words', () => {
    const sourceText =
      'Thanks for calling Alliance Appliance Repair. Your booking code is 493A, confirmed for $12.50 at 2:15 PM.';
    const passTranscript =
      'Thanks for calling Alliance Appliance Repair. Your booking code is 493A, confirmed for $12.50 at 2:15 PM.';
    const passGrade = gradeRoundTripEntities(sourceText, passTranscript, false);
    expect(passGrade.verdict).toBe('PASS');
    expect(passGrade.accuracyPercent).toBe(100);
    expect(passGrade.entities.every((e) => e.matched)).toBe(true);

    const leakedTranscript =
      'Pause. Thanks for calling Alliance Appliance Repair. Your booking code is 493, confirmed for $12.50 at 2:15 PM.';
    const failGrade = gradeRoundTripEntities(
      '[pause] ' + sourceText,
      leakedTranscript,
      true
    );
    expect(failGrade.verdict).toBe('FAIL');
    expect(failGrade.leakedBracketWords).toContain('pause');
  });

  it('generates a reproducible Bug Bounty markdown packet with X-Request-Id and server-timing', () => {
    const md = buildBugBountyMarkdown({
      runId: 'TP-2026-01',
      requestId: 'a3d950e6-5c6c-4a1d-8d2f-91e4b8c72a10',
      voiceId: 'aai-jane',
      language: 'english',
      rawPrompt: '[pause] Your code is 493A.',
      compiledPrompt: 'Your code is 4-9-3-A.',
      sttTranscript: 'Pause. Your code is 493A.',
      serverTiming: 'open;dur=12.3, model;dur=22.8, ttfa;dur=35.1',
      verdict: 'FAIL',
      notes: 'Square brackets converted to round brackets and spoken literally.',
    });
    expect(md).toContain('a3d950e6-5c6c-4a1d-8d2f-91e4b8c72a10');
    expect(md).toContain('ttfa;dur=35.1');
    expect(md).toContain('assemblyai-tts-1');
  });
});
