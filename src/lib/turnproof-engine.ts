export interface PromptHazard {
  id: string;
  kind:
    | 'bracket_tag'
    | 'ssml_tag'
    | 'alphanumeric_code'
    | 'unspaced_phone'
    | 'short_opening_sentence'
    | 'exclamation_overuse';
  originalToken: string;
  replacementToken: string;
  reason: string;
}

export interface CompiledTurnResult {
  rawText: string;
  compiledText: string;
  hazards: PromptHazard[];
  firstSentenceLength: number;
  requiresFirstSentenceFlush: boolean;
  characterCount: number;
}

export interface WordBoundaryFrame {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface BargeInSliceResult {
  cutMs: number;
  heardWords: WordBoundaryFrame[];
  cutWords: WordBoundaryFrame[];
  heardText: string;
  cutText: string;
  withheldEntities: string[];
  patchedAssistantMessage: {
    role: 'assistant';
    content: string;
    metadata: {
      model: string;
      bargeInCutMs: number;
      spokenWordCount: number;
      droppedWordCount: number;
      withheldEntities: string[];
    };
  };
}

export interface EntityMatchItem {
  entity: string;
  category: 'code' | 'currency' | 'time' | 'phone' | 'number';
  matched: boolean;
}

export interface RoundTripGradeResult {
  verdict: 'PASS' | 'DRIFT' | 'FAIL';
  accuracyPercent: number;
  entities: EntityMatchItem[];
  leakedBracketWords: string[];
  summary: string;
}

export interface BugBountyPacketInput {
  runId: string;
  requestId: string;
  voiceId: string;
  language: string;
  rawPrompt: string;
  compiledPrompt: string;
  sttTranscript: string;
  serverTiming: string;
  verdict: 'PASS' | 'DRIFT' | 'FAIL';
  notes: string;
}

/**
 * Compiles and sanitizes a raw LLM voice agent turn for AssemblyAI-TTS-1 (`assemblyai-tts-1`).
 * Enforces official Prompting Guide rules:
 * 1. Strips square/curly/angle bracket stage tags (`[pause]`, `[laughs]`, `<break/>`) which
 *    AssemblyAI-TTS-1 otherwise converts to round brackets and reads aloud as literal words.
 * 2. Converts mixed alphanumeric codes (`493A`, `ZX90B`) into dashed groups (`4-9-3-A`) for
 *    character-by-character pronunciation.
 * 3. Flags opening sentences under 50 characters that require an explicit WebSocket `Flush` message.
 */
export function compileVoiceTurnPrompt(rawText: string): CompiledTurnResult {
  const hazards: PromptHazard[] = [];
  let text = rawText;

  // 1. Detect XML/SSML tags such as <break time="500ms"/> or <speak>
  const ssmlRegex = /<\/?[a-zA-Z][^>]*>/g;
  text = text.replace(ssmlRegex, (match) => {
    hazards.push({
      id: `ssml-${hazards.length + 1}`,
      kind: 'ssml_tag',
      originalToken: match,
      replacementToken: '...',
      reason:
        'AssemblyAI-TTS-1 does not parse SSML tags and will read tag names aloud. Replaced with natural ellipsis pause.',
    });
    return ' ';
  });

  // 2. Detect square or curly bracket stage directions like [pause], [laughs], {sigh}
  const bracketRegex = /[\[\{]([^\]\}]{1,32})[\]\}]/g;
  text = text.replace(bracketRegex, (match, inner: string) => {
    const cleanInner = inner.trim().toLowerCase();
    const isPause =
      cleanInner.includes('pause') ||
      cleanInner.includes('wait') ||
      cleanInner.includes('beat') ||
      cleanInner.includes('silence');
    const replacement = isPause ? '' : '';
    hazards.push({
      id: `bracket-${hazards.length + 1}`,
      kind: 'bracket_tag',
      originalToken: match,
      replacementToken: replacement || '(removed)',
      reason:
        'AssemblyAI-TTS-1 converts square/curly brackets to round brackets and speaks the word inside aloud.',
    });
    return replacement;
  });

  // 3. Detect mixed alphanumeric booking/confirmation codes (e.g., 493A, 7B29, A492)
  // Avoid matching times like 2:15pm, 10am, or ordinals like 1st, 2nd, 3rd, 4th, or kHz/ms
  const codeRegex = /\b(?=[A-Za-z0-9]{3,8}\b)(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])(?!(?:\d+(?:st|nd|rd|th|am|pm|AM|PM|ms|kHz|Hz|px|gb|mb))\b)[A-Za-z0-9]+\b/g;
  text = text.replace(codeRegex, (match) => {
    if (match.includes('-')) return match;
    const dashed = match.toUpperCase().split('').join('-');
    hazards.push({
      id: `code-${hazards.length + 1}`,
      kind: 'alphanumeric_code',
      originalToken: match,
      replacementToken: dashed,
      reason:
        'Dashes between alphanumeric characters force character-by-character pronunciation in assemblyai-tts-1.',
    });
    return dashed;
  });

  // 4. Normalize excessive exclamation marks to calm period prosody when following greeting
  if (text.includes('! ')) {
    text = text.replace(/!\s+/g, (match) => {
      hazards.push({
        id: `excl-${hazards.length + 1}`,
        kind: 'exclamation_overuse',
        originalToken: '!',
        replacementToken: '.',
        reason:
          'Period prosody keeps customer service readback steady before numeric entities.',
      });
      return '. ';
    });
  }

  // Clean up leading/double spaces
  text = text.replace(/\s{2,}/g, ' ').trim();

  // Check first sentence length against the 50-character WebSocket streaming threshold
  const firstSentenceMatch = text.match(/^[^.!?]+[.!?]/);
  const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : text;
  const firstSentenceLength = firstSentence.length;
  const requiresFirstSentenceFlush = firstSentenceLength < 50;

  if (requiresFirstSentenceFlush && text.length > 0) {
    hazards.push({
      id: `flush-${hazards.length + 1}`,
      kind: 'short_opening_sentence',
      originalToken: firstSentence,
      replacementToken: `${firstSentence} [WS: send {"type":"Flush"}]`,
      reason: `Opening sentence is ${firstSentenceLength} chars (<50 char threshold); WebSocket streams wait for more text unless Flush is sent.`,
    });
  }

  return {
    rawText,
    compiledText: text,
    hazards,
    firstSentenceLength,
    requiresFirstSentenceFlush,
    characterCount: text.length,
  };
}

/**
 * Extracts key entities (codes, prices, times, phone numbers) from a text fragment.
 */
export function extractEntitiesFromText(text: string): EntityMatchItem[] {
  const results: EntityMatchItem[] = [];
  const seen = new Set<string>();

  // Currency ($12.50, $100)
  const currencyMatches = text.match(/\$\d+(?:\.\d{1,2})?/g) || [];
  for (const m of currencyMatches) {
    if (!seen.has(m)) {
      seen.add(m);
      results.push({ entity: m, category: 'currency', matched: false });
    }
  }

  // Time (2:15 PM, 10:30 AM)
  const timeMatches = text.match(/\b\d{1,2}:\d{2}(?:\s?[APap][Mm])?\b/g) || [];
  for (const m of timeMatches) {
    const clean = m.trim();
    if (!seen.has(clean)) {
      seen.add(clean);
      results.push({ entity: clean, category: 'time', matched: false });
    }
  }

  // Dashed alphanumeric codes (4-9-3-A) or raw codes (493A)
  const dashedCodeMatches =
    text.match(/\b[A-Z0-9](?:-[A-Z0-9]){2,7}\b/gi) || [];
  for (const m of dashedCodeMatches) {
    const collapsed = m.replace(/-/g, '').toUpperCase();
    if (!seen.has(collapsed)) {
      seen.add(collapsed);
      results.push({ entity: collapsed, category: 'code', matched: false });
    }
  }

  const rawCodeMatches =
    text.match(
      /\b(?=[A-Za-z0-9]{3,8}\b)(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])(?!(?:\d+(?:st|nd|rd|th|am|pm|AM|PM|ms|kHz|Hz))\b)[A-Za-z0-9]+\b/g
    ) || [];
  for (const m of rawCodeMatches) {
    const upper = m.toUpperCase();
    if (!seen.has(upper)) {
      seen.add(upper);
      results.push({ entity: upper, category: 'code', matched: false });
    }
  }

  // Phone numbers (555-019-2834 or 555-0192)
  const phoneMatches = text.match(/\b\d{3}-\d{3}(?:-\d{4})?\b/g) || [];
  for (const m of phoneMatches) {
    if (!seen.has(m)) {
      seen.add(m);
      results.push({ entity: m, category: 'phone', matched: false });
    }
  }

  return results;
}

/**
 * Slices a spoken voice agent turn at an exact millisecond caller barge-in point
 * using AssemblyAI's `WordBoundaries` frames.
 */
export function sliceBargeInTurn(
  words: WordBoundaryFrame[],
  cutMs: number
): BargeInSliceResult {
  const safeCutMs = Math.max(0, Math.round(cutMs));
  const heardWords: WordBoundaryFrame[] = [];
  const cutWords: WordBoundaryFrame[] = [];

  for (const w of words) {
    if (w.start < safeCutMs) {
      heardWords.push(w);
    } else {
      cutWords.push(w);
    }
  }

  const rawHeard = heardWords.map((w) => w.word).join(' ');
  const heardText =
    heardWords.length > 0 && cutWords.length > 0
      ? `${rawHeard.replace(/[,.!?;:]+$/, '')}--`
      : rawHeard;
  const cutText = cutWords.map((w) => w.word).join(' ');

  const withheldEntities = extractEntitiesFromText(cutText).map(
    (item) => item.entity
  );

  return {
    cutMs: safeCutMs,
    heardWords,
    cutWords,
    heardText,
    cutText,
    withheldEntities,
    patchedAssistantMessage: {
      role: 'assistant',
      content: heardText,
      metadata: {
        model: 'assemblyai-tts-1',
        bargeInCutMs: safeCutMs,
        spokenWordCount: heardWords.length,
        droppedWordCount: cutWords.length,
        withheldEntities,
      },
    },
  };
}

/**
 * Wraps an array of base64-encoded 16-bit signed little-endian PCM (`pcm_s16le`) chunks
 * into a standard 44-byte RIFF WAVE buffer for playback and Universal-3.5 Pro upload.
 */
export function encodePcm16ToWavBuffer(
  base64Chunks: string[],
  sampleRate = 24000
): Buffer {
  const pcmBuffers = base64Chunks.map((b64) => Buffer.from(b64, 'base64'));
  const pcmData = Buffer.concat(pcmBuffers);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 4, 'ascii');
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8, 4, 'ascii');
  header.write('fmt ', 12, 4, 'ascii');
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 4, 'ascii');
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

/**
 * Grades round-trip entity accuracy between the intended prompt and Universal-3.5 Pro's transcript.
 */
export function gradeRoundTripEntities(
  intendedText: string,
  sttTranscript: string,
  checkBracketLeaks = true
): RoundTripGradeResult {
  const entities = extractEntitiesFromText(intendedText);
  const normTranscript = sttTranscript
    .toUpperCase()
    .replace(/[^A-Z0-9$.:]/g, '');

  let matchedCount = 0;
  for (const item of entities) {
    const normEntity = item.entity.toUpperCase().replace(/[^A-Z0-9$.:]/g, '');
    if (normTranscript.includes(normEntity)) {
      item.matched = true;
      matchedCount += 1;
    } else {
      item.matched = false;
    }
  }

  const leakedBracketWords: string[] = [];
  if (checkBracketLeaks) {
    const bracketMatches = intendedText.match(/[\[\{]([^\]\}]{1,32})[\]\}]/g) || [];
    for (const rawTag of bracketMatches) {
      const inner = rawTag.replace(/[\[\]\{\}]/g, '').trim().toLowerCase();
      if (
        inner &&
        new RegExp(`\\b${inner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
          sttTranscript
        )
      ) {
        leakedBracketWords.push(inner);
      }
    }
  }

  const accuracyPercent =
    entities.length === 0
      ? leakedBracketWords.length === 0
        ? 100
        : 0
      : Math.round((matchedCount / entities.length) * 100);

  let verdict: 'PASS' | 'DRIFT' | 'FAIL' = 'PASS';
  if (leakedBracketWords.length > 0 || accuracyPercent < 60) {
    verdict = 'FAIL';
  } else if (accuracyPercent < 100) {
    verdict = 'DRIFT';
  }

  const summary =
    leakedBracketWords.length > 0
      ? `Spoken bracket leak detected ("${leakedBracketWords.join('", "')}") in Universal-3.5 Pro transcript.`
      : `${matchedCount} of ${entities.length} target entities verified (${accuracyPercent}%).`;

  return {
    verdict,
    accuracyPercent,
    entities,
    leakedBracketWords,
    summary,
  };
}

/**
 * Formats a reproducible Hackathon Bug Bounty & Edge-Case Packet in Markdown.
 */
export function buildBugBountyMarkdown(input: BugBountyPacketInput): string {
  return [
    `# AssemblyAI-TTS-1 Protocol & Readback Report (${input.runId})`,
    ``,
    `- **Model:** \`assemblyai-tts-1\` -> Verified via \`universal-3-5-pro\``,
    `- **Endpoint:** \`POST https://tts.us.assemblyai.com/v1/speech/events\``,
    `- **X-Request-Id:** \`${input.requestId}\``,
    `- **Server-Timing:** \`${input.serverTiming}\``,
    `- **Voice / Language:** \`${input.voiceId}\` (\`${input.language}\`)`,
    `- **Verification Verdict:** **${input.verdict}**`,
    ``,
    `## 1. Input Payload Comparison`,
    `- **Raw Turn Text:** \`${input.rawPrompt}\``,
    `- **TurnProof Compiled Text:** \`${input.compiledPrompt}\``,
    ``,
    `## 2. Round-Trip Universal-3.5 Pro Transcript`,
    `> "${input.sttTranscript}"`,
    ``,
    `## 3. Finding & Reproducibility Notes`,
    `${input.notes}`,
  ].join('\n');
}
