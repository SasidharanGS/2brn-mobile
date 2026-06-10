# Phase 2 — The local LLM (ask & answer)

> The centerpiece: a small **on-device LLM** that turns Phase 0's *search* (find the matching notes) into
> *ask & answer* (write a grounded reply from them). Still **fully on-device**, same single
> `react-native-executorch` toolkit as embeddings/OCR/STT. See the decided architecture in
> [`PARITY.md` Part 6](./PARITY.md#part-6--decided-architecture).
>
> _Created 2026-06-10. Target device: OnePlus 15 (also runs on the `Pixel_8` emulator)._

## Goal (one sentence)

**Ask your second brain a question and get a short written answer grounded in your own notes** — retrieved
locally (Phase 0 search) and written locally (this LLM), with no cloud.

## The "finding vs writing" split, completed

Phase 0 deliberately shipped *finding* (semantic search returns the matching items) and left *writing*
for here. Phase 2 closes that: **retrieve top-k hits → feed them to the LLM as grounding context →
generate a concise answer**. This is a tiny on-device **RAG** loop, reusing `rankBySimilarity` unchanged.

## Model choice (correction to the roadmap)

Earlier notes said "Gemma". **executorch 0.9.0 ships no Gemma** — its built-in LLMs are Llama 3.2,
Qwen 2.5/3, SmolLM 2, Phi-4-mini, Hammer, LFM, Bielik. We use **Llama 3.2 1B (SpinQuant)** — Meta's
mobile-optimized quantization (~1 GB), a good quality/size/speed balance for grounded answers over short
note context. It's a **one-constant swap** in `src/ml/llm.ts` (e.g. `LLAMA3_2_3B_SPINQUANT` or
`QWEN2_5_1_5B_QUANTIZED` for more quality); embeddings/notes are unaffected.

## Branch plan

| Order | Branch | Goal | State |
|---|---|---|---|
| **A** | **`feat/local-llm`** | LLM engine + **ask-and-answer** over search hits. | ✅ built (this branch) |
| B _(next)_ | `feat/llm-enrich` | On capture → auto **tag + one-line summary** (LLM enriches each saved memory). | planned |

### Branch A — `feat/local-llm`

**Pieces**
1. `src/ml/prompt.ts` — **pure**, native-free, unit-tested `buildAnswerMessages(question, sources)`: a
   system instruction that forbids hallucination (answer only from the provided notes) + a user turn that
   embeds the retrieved notes as context. Mirrors `ocrText.ts` / `audioWaveform.ts`.
2. `src/ml/llm.ts` — the model choice (`LLAMA3_2_1B_SPINQUANT`) + `ANSWER_CONTEXT_SIZE` (top-k = 4).
3. `src/ml/LlmContext.tsx` — a provider mirroring Ocr/Stt: **lazy-loads** the LLM (preventLoad until first
   ask — a user who never asks never pays the ~1 GB download) and exposes
   `answer(question, sources): Promise<string>` via executorch's stateless `generate()`, plus
   isReady/isLoading/isGenerating/downloadProgress/error.
4. `app/memories.tsx` — after a search, an **"✨ Ask 2brn about this"** button runs the top hits through
   `answer()` and shows the reply in an **Answer** card above the source items.

**Check (definition of done)**
- ✅ typecheck / lint / test green (60 tests; the prompt builder is unit-tested).
- ✅ JS bundle loads cleanly (full provider tree incl. `LlmProvider`); add → search → the **Ask 2brn**
  button rendering verified on the emulator (note matched at 58%); app stable, embeddings/search intact.
- ⏳ **Answer generation pending OnePlus 15** — the LLM uses the same instruction path as OCR/Whisper, so
  it hits the same Apple-Silicon emulator SVE `SIGILL` (and would first pull ~1 GB). Verify a real
  grounded answer on the device. (See the Branch A caveat in [`PHASE-1.md`](./PHASE-1.md).)

## Out of scope for Phase 2

- ❌ **Auto tag/summary on capture** → Branch B (`feat/llm-enrich`).
- ❌ **Multi-turn chat / conversation memory** → `generate()` is stateless on purpose (one question, one
  grounded answer); a chat surface can come later if wanted.
- ❌ **Two-way desktop sync** → Phase 3.
