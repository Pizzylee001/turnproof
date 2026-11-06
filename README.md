# TurnProof

**Pre-flight prompt compiler, millisecond `WordBoundaries` barge-in context slicer, round-trip `Universal-3.5 Pro` entity readback verifier, and reproducible bug-bounty packet generator for AssemblyAI voice agents.**

Built for **AssemblyAI Online Hackathon #2 of 2026** (`assemblyai-tts-1` + `universal-3-5-pro`).

---

## What Problem TurnProof Solves

Production voice agents built on LLMs and streaming Text-to-Speech fail in two places that standard API playgrounds cannot catch:

1. **Prompt Normalization & Stage-Tag Leaks:** LLMs frequently emit stage tags like `[pause]` or `[wait]` and compact alphanumeric confirmation codes like `493A`. On `POST https://tts.us.assemblyai.com/v1/speech/events`, `assemblyai-tts-1` converts square brackets into round brackets `(pause)` inside `WordBoundaries` (`0 ms` to `501 ms`) and speaks the word `"Pause"` out loud to the caller.
2. **Caller Barge-In Memory Drift:** When a caller interrupts an agent mid-sentence (for example, at `4,370 ms`), the LLM conversation state (`messages`) still records the entire generated paragraph as spoken. If a booking code (`493A`), price (`$12.50`), or appointment time (`2:15 PM`) sat in the unheard second half of the sentence, the agent assumes the caller heard it and never repeats it.

TurnProof gives voice engineers a 4-page pre-flight workbench to sanitize turns, slice interrupted audio at the exact millisecond using live `WordBoundaries`, verify entity survival through `Universal-3.5 Pro` STT, and export reproducible protocol reports.

---

## 4-Page Route Architecture

1. **`/` (`src/app/page.tsx`) - Acoustic Stage & Turn Intake**
   - Audition captured 24 kHz `pcm_s16le` streams across `aai-jane` and `aai-felix` in English and Spanish, inspect real `X-Request-Id` telemetry, and draft a voice agent turn with live hazard detection.
2. **`/studio` (`src/app/studio/page.tsx`) - Turn Compiler & Barge-In Scissor**
   - Compares raw LLM text against the sanitized `assemblyai-tts-1` payload, streams live 24 kHz audio from `POST /v1/speech/events`, and provides the **Millisecond Barge-In Waveform Scissor** to split spoken `heard_text` from unheard `cut_text` while auto-patching the assistant `messages` JSON and flagging withheld entities.
3. **`/verify` (`src/app/verify/page.tsx`) - Round-Trip Entity Verification Lab**
   - Pipes synthesized `assemblyai-tts-1` 24 kHz PCM chunks into a RIFF WAVE container, uploads and transcribes the audio via AssemblyAI `Universal-3.5 Pro` (`POST /v2/upload` + `POST /v2/transcript` with `speech_models: ["universal-3-5-pro"]`), and grades exact readback accuracy for confirmation codes, prices, and times.
4. **`/ledger` (`src/app/ledger/page.tsx`) - Saved Runs, Code Export & Bug-Bounty Studio**
   - Stores verification runs, generates ready-to-ship TypeScript and Python streaming code snippets, and exports formatted Markdown Bug-Bounty packets with `X-Request-Id` and `Server-Timing` headers.

---

## Verified AssemblyAI Protocol & Bug-Bounty Findings Included

### Finding #01: Bracket-to-Paren Spoken Tag Leak on `POST /v1/speech/events`
- **Captured in Run `TP-2026-02` (`X-Request-Id: c12690a7-286c-4a62-b859-1fb0706c59bc`):**
- Sending `[pause] Thanks for calling Alliance Appliance Repair! Your booking code is 493A, confirmed for $12.50 at 2:15 PM.` to `assemblyai-tts-1` (`aai-jane`) returns `WordBoundaries` starting with `{"word": "(pause)", "start": 274, "end": 501, "confidence": 0.448}`.
- Round-trip verification with `Universal-3.5 Pro` (`Transcript ID: 2989165b-2c26-4a34-9c4c-2a3fc78556aa`) transcribes the audio as:
  > `"Pause. Thanks for calling Alliance Appliance Repair. Your booking code is 493A, confirmed for $12.50 at 2:15 PM."`
- **Mitigation in TurnProof:** The pre-flight compiler strips square, curly, and angle-bracket stage tags before synthesis and formats mixed alphanumeric codes into dashed groups (`4-9-3-A`), verified in Run `TP-2026-01` (`X-Request-Id: e6479cf7-3701-4382-8cb5-524143bd9258`).

### Finding #02: Silent Empty Transcript When `language_detection: false` Is Passed Without `language_code` on `Universal-3.5 Pro`
- Submitting `{"audio_url": "...", "speech_models": ["universal-3-5-pro"], "language_detection": false}` to `POST https://api.assemblyai.com/v2/transcript` without an explicit `language_code` returns HTTP 200 and transitions to `status: "completed"` with an empty transcript (`text: ""`, `words: []`) rather than defaulting to `en_us` or returning a `400` validation error.
- **Mitigation in TurnProof:** Omit `language_detection` for English streams (using the default English pipeline) and pass `language_detection: true` for non-English synthesis verification.

---

## Local Development & Vercel Deployment

### 1. Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

### 2. Environment Variables (Vercel or `.env.local`)
Set `ASSEMBLYAI_API_KEY` in your Vercel project settings (or paste a key in the top-bar **API Armed / Set API Key** modal in the browser):
```bash
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```
Even before an API key is entered, TurnProof ships with 4 real captured 24 kHz WAV streams (`/public/samples/tp-01-compiled.wav` through `tp-04-spanish.wav`) and their full `WordBoundaries` and `Universal-3.5 Pro` verification records in `src/data/seed-runs.json`.

### 3. Run Unit & E2E Tests
```bash
npx vitest run
npx playwright test
```
