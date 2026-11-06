# TurnProof Design System (`DESIGN.md` — v2 Spacious Acoustic Cinema)

## 1. Aesthetic Direction & Domain Grounding
- **Product:** `TurnProof` (Pre-flight prompt compiler, `assemblyai-tts-1` to `Universal-3.5 Pro` round-trip entity readback verifier, millisecond `WordBoundaries` barge-in context slicer, and reproducible bug-bounty packet generator).
- **Catalog Style Selection (`01-ui-ux-design.md`):**
  - Primary style: **`Modern Dark (Cinema)`** + **`Voice-First Multimodal`** (`01-ui-ux-design.md` lines 860, 1116).
  - Supplemental data pattern: **`Comparative Analysis Dashboard`** (`01-ui-ux-design.md` line 996) for before/after prompt sanitization diffs and TTS-to-STT entity readback grading.
- **Dials (`09-ledger.md`):**
  - `DESIGN_VARIANCE: 7` (Generous asymmetric whitespace, oversized typographic metrics, and a full-bleed sculptural canvas waveform).
  - `MOTION_INTENSITY: 6` (Smooth `cubic-bezier(0.16, 1, 0.3, 1)` transitions, fluid 60fps acoustic wave rendering, and tactile millisecond scrubbing).
  - `VISUAL_DENSITY: 4` (Airy, editorial-grade studio layout; 35%+ open midnight canvas; max 2 cards per row; max 3 data points per surface; zero nested cards).
  - `ENERGY: 2 | RHYTHM: 3 | MOTION: 2`

---

## 2. True 4-Page Route Map
Each route is an independent Next.js App Router page under `src/app/` with its own URL, layout, and focused job:

1. **`/` (`src/app/page.tsx`) — Acoustic Stage & Turn Intake**
   - Full-bleed interactive **24 kHz Copper & Cyan Acoustic Ribbon** hero stage, live voice/language audition selector (`aai-jane`, `aai-felix`, `EN`/`ES`/`FR`/`DE`/`IT`/`PT`), and a spacious script composer that launches directly into `/studio`.
2. **`/studio` (`src/app/studio/page.tsx`) — Pre-Flight Compiler & Barge-In Scissor**
   - Spacious side-by-side typographic diff (Raw Input vs Sanitized `assemblyai-tts-1` Payload) above the full-width **Sculptural Waveform Scissor** where dragging or stepping the copper cut-line plays the 24 kHz stream and slices spoken `heard_text` from unspoken `cut_text`.
3. **`/verify` (`src/app/verify/page.tsx`) — Round-Trip STT Verification Lab**
   - Dedicated verification runner that pipes `assemblyai-tts-1` PCM audio into a 24 kHz WAV buffer, transcribes it with AssemblyAI `Universal-3.5 Pro` (`POST /v2/transcript`), and renders spacious entity accuracy cards (booking codes, prices, phone numbers, dates, acronyms).
4. **`/ledger` (`src/app/ledger/page.tsx`) — Saved Runs, Code Export & Bug-Bounty Studio**
   - Persistent run archive with revision comparison, one-click export of production Python/TypeScript streaming code, and a formatted **Hackathon Bug Bounty Packet** (`X-Request-Id`, `server-timing`, SSE frame timeline, and STT readback diff).

---

## 3. Color Palette (`Navy + copper` Family, `09-ledger.md` Section B)
- **Theme Polarity:** **Intentional Dark Mode** (Deep Midnight Acoustic Stage).

| Token | Hex / Value | Role & Contrast Ratio against Ground (`#070A12`) |
|---|---|---|
| `--bg-primary` | `#070A12` | Deep Midnight Acoustic Canvas (never pure `#000000` per `R-09`) |
| `--bg-elevated` | `#0E1422` | Translucent Studio Surface (`rgba(14, 20, 34, 0.76)` with `backdrop-filter: blur(20px)`) |
| `--bg-well` | `#131B2E` | Soft recessed audio canvas & code surface |
| `--text-primary` | `#F4F6FB` | Crisp studio ivory for headlines & primary script (`17.4:1` AAA) |
| `--text-secondary` | `#A3B1C6` | Airy slate-silver for descriptions & secondary readouts (`8.6:1` AAA) |
| `--text-muted` | `#76869E` | Timecode ruler markers & metadata captions (`4.9:1` AA) |
| `--accent-primary` | `#F08C4B` | Burnished Acoustic Copper for primary CTAs, active wave, & Barge-In Cut-Line (`8.1:1` vs `#070A12`; `#070A12` ink on `#F08C4B` is `8.1:1` AAA) |
| `--accent-secondary` | `#38BDF8` | Luminous Wave Cyan for `WordBoundaries` tokens & STT readback lock (`9.4:1` AAA) |
| `--status-pass` | `#34D399` | Mint Signal Lock for 100% entity readback accuracy (`9.8:1` AAA) |
| `--status-warn` | `#FBBF24` | Warm Gold for latency or normalization warnings (`11.6:1` AAA) |
| `--status-fail` | `#FB7185` | Coral Clip Alert for literal spoken brackets (`[pause]`) or entity drift (`6.7:1` AA) |
| `--border-hairline` | `rgba(255, 255, 255, 0.08)` | Subtle luminous surface edge |
| `--border-active` | `rgba(240, 140, 75, 0.45)` | Active copper focus/selection edge |

---

## 4. Typography (`Tech Startup` + `Science/Tech` Mono, `01-ui-ux-design.md` lines 1702, 1741)
- **Display & Headlines (`--font-display`):** `Space Grotesk` (`500`, `600`, `700`), tracking `-0.03em`.
- **UI & Prose (`--font-sans`):** `DM Sans` (`400`, `500`, `600`), `16px-18px` body copy with `1.65` line-height.
- **Timecodes & Telemetry (`--font-mono`):** `Roboto Mono` (`400`, `500`) with `font-variant-numeric: tabular-nums`.

---

## 5. Navigation, Footer & Button Voice (`09-ledger.md` Rules 9 & 10)
- **Navigation Archetype:** **`N5` (Floating Frosted-Glass Pill Bar)** linking `/`, `/studio`, `/verify`, and `/ledger`.
- **Footer Archetype:** **`Ft3` (Minimal Single-Line Colophon)**.
- **Button Voice:** **`Form-as-CTA` + Luminous Copper Pill Triggers**.
