# Phase 1 — Broaden mobile-native capture

> The phone's **unique value**: capture the signals a desktop can't — images you screenshot, things you
> say, what notifies you — and fold them into the same on-device, searchable memory built in
> [`PHASE-0.md`](./PHASE-0.md). Still **fully on-device**, still **no LLM** (that's Phase 2). See the
> decided architecture in [`PARITY.md` Part 6](./PARITY.md#part-6--decided-architecture).
>
> _Created 2026-06-10. Target device: OnePlus 15 (also runs on the `Pixel_8` emulator)._

## Goal (one sentence)

**More kinds of things get into 2brn on the phone** — images (their text), voice notes, and later
notifications/app-usage — each captured, embedded, and made semantically searchable **offline**, reusing
the Phase 0 pipeline (`embed → insertMemory → rankBySimilarity`).

## Why this is Phase 1 (and not the LLM)

- Phase 0 proved the hard native bits (on-device DB + ML). Phase 1 **widens the funnel** of what you can
  capture — that's the phone's edge over the desktop, and it's what makes the Phase 2 LLM worth having
  (more, richer memories to reason over).
- Every capture path lands in the **same `memories` table** with an embedding, so search "just works"
  across all of them with zero new search code.

## One toolkit (correction to Part 7/8)

Parts 7–8 of `PARITY.md` were written before we locked the stack and still name **ML Kit / ONNX**. The
**decided** approach ([Part 6](./PARITY.md#part-6--decided-architecture)) is the single
**`react-native-executorch`** toolkit for *all* on-device ML. Phase 1 confirms it covers what we need:

| Capability | Executorch hook | Verified present (0.9.0) |
|---|---|---|
| OCR (image → text) | `useOCR` (+ `OCR_ENGLISH` model) | ✅ |
| Speech-to-text (voice → text) | `useSpeechToText` (Moonshine / Whisper) | ✅ |

So we do **not** add ML Kit or ONNX. (PARITY Part 7/8 will be reconciled to this when Phase 1 lands.)

## Branch plan (one branch per goal → merge to `main` when its check passes)

Repo now matches the desktop: default branch **`main`**, feature branches `feat/…`, merged when the
branch's stated check is green (`typecheck` + `lint` + `test`, and an on-device verification).

| Order | Branch | Goal | Why this order |
|---|---|---|---|
| **A** | **`feat/ocr-image-capture`** | Share **or pick an image** → on-device OCR extracts its text → saved as a searchable memory. | Reuses the executorch toolkit already wired in Phase 0; extends the existing `share.tsx`; **no new dangerous permissions / native Kotlin**. Highest value-to-effort (screenshots are the #1 mobile capture). |
| **B** | **`feat/voice-capture`** | Record a voice note → on-device speech-to-text → saved as a searchable memory. | Same toolkit (`useSpeechToText`); adds only the mic permission + an audio recorder. |
| C _(deferred)_ | `feat/notification-capture` | Capture notification text (opt-in, prominent disclosure). | Needs a **custom Kotlin `NotificationListenerService`** + Play policy disclosure — heavier; do after A/B prove the capture→store→search loop on more surfaces. |
| D _(deferred)_ | `feat/app-usage` | Daily app-usage signal. | Needs a native module + the special `PACKAGE_USAGE_STATS` permission — heaviest, lowest marginal value pre-LLM. |

> **Sequencing rationale:** A and B are pure additive flows on the existing pipeline with no policy risk,
> so they ship fast and safely. C and D require custom native modules and sensitive-permission
> disclosures; we hold them until the LLM (Phase 2) gives that data somewhere richer to go, and revisit
> whether they're worth the Play-policy surface.

---

### Branch A — `feat/ocr-image-capture` (first)

**Goal:** an image becomes searchable text, fully offline.

**Pieces**
1. `src/ml/ocr.ts` — the model choice (`OCR_ENGLISH`) + a **pure** `joinOcrText(detections)` that orders
   the detected boxes into reading order and joins them. Unit-tested (no native dep — type-only import).
2. `src/ml/OcrContext.tsx` — a provider that **lazy-loads** the OCR model (it's large; don't download it
   until the user actually uses image capture) and exposes `extractText(uri): Promise<string>`, plus
   `isReady` / `downloadProgress` / `error`. Mirrors `EmbeddingsContext`.
3. `app/share.tsx` — when the share intent is an **image** (`type === 'media'` / `files[].mimeType`
   starts with `image/`), show a thumbnail, run OCR, and prefill the editable note with the extracted
   text. Saving then reuses the existing `embed → insertMemory` path (`source: 'mobile-image'`).
4. `app/memories.tsx` — a **"From image"** button (via `expo-image-picker`) so you can pick a screenshot
   from the gallery and capture its text without the share sheet (also the easiest way to verify).
5. A bundled `assets/ocr-selftest.png` (known text) + a dev-only self-test in `_layout.tsx` that OCRs it
   and logs the result — same money-shot pattern as Phase 0's self-tests.

**Check (definition of done)**
- ✅ Pick/share an image of some text → its text lands in the note, saves, and is found by a meaning
  search — **network off**. Dev self-test logs `[2brn-ocr-selftest] text="…"` matching the known image.
- ✅ `npm run typecheck` / `lint` / `test` green; runs on `Pixel_8` + OnePlus 15.

### Branch B — `feat/voice-capture` (after A)

**Goal:** a spoken note becomes searchable text, fully offline.

**Pieces (sketch — detailed when A merges):** mic permission + an audio recorder (expo-audio), an
`SttContext` mirroring the OCR/embeddings providers (`useSpeechToText`, lazy-loaded), a record→transcribe
UI on `memories.tsx`, `source: 'mobile-voice'`. Same `embed → insertMemory → search` tail. Self-test
transcribes a bundled short clip.

---

## Out of scope for Phase 1

- ❌ **Local LLM / written answers, tagging, summaries** → **Phase 2** (search still returns items).
- ❌ **Two-way desktop memory sync** → **Phase 3** (the best-effort note-POST from Phase 0 stays).
- ❌ **Continuous screen capture / AccessibilityService reading** → rejected (Play policy; sideload-only
  personal mode at most). See `PARITY.md` Part 6.
- ❌ **Background/periodic capture (WorkManager)** → only if a capture path actually needs it; not a goal
  in itself (the ≥15-min floor + OEM battery killing make it low-value pre-LLM).

## Gotchas carried over from Phase 0

- Native deps need a **dev client** + clean prebuild; after `expo prebuild --clean`, restore
  `git checkout -- expo-env.d.ts tsconfig.json` (see [`PARITY.md` appendix](./PARITY.md#appendix--buildenvironment-gotchas-discovered)).
- Executorch models **download on first use** and cache on-device — the OCR/STT models add their own
  one-time download (lazy-loaded, so only if the user uses that capability).
