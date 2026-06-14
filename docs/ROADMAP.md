# 2brn Mobile — Roadmap & Progress

> The "where are we?" file. The project has two layers: the **optional desktop companion**
> (built first, complete) and the **on-device brain** (the current focus). Checkboxes
> reflect work that has landed on `main`. See [`DESIGN.md`](./DESIGN.md) for the design,
> [`PARITY.md`](./PARITY.md) for the on-device strategy, and the per-phase plans
> [`PHASE-0.md`](./PHASE-0.md)–[`PHASE-3.md`](./PHASE-3.md).

**Legend:** ⬜ not started · 🟦 in progress · ✅ done · 📵 built, pending physical-device verification

---

## Layer 1 — Optional desktop companion ✅

The phone's first incarnation: a secure LAN client to the desktop daemon, plus the
share-sheet capture source. This is **complete** and is now the *optional companion* layer
(additive, never required by the on-device brain).

- [x] Connection layer — `api/types.ts`, `api/client.ts`, `api/sse.ts`, `api/mock.ts`, `queryClient`
- [x] `ConnectionContext` + secure-store token + `useApi`/`useConnection`; Pair screen (QR + manual)
- [x] Daemon bridge (desktop `main`): `lan_access`, `GET /connection-info`, `POST/GET/DELETE /ingest/note(s)`, `shared_notes`, terminal pairing helper
- [x] Home (status/today/quick actions), Insights (day/week/month), Journal (read/gen/edit), Blog (read/gen/edit)
- [x] Chat — streaming RAG via `expo/fetch` (+ buffered fallback)
- [x] Timeline (read-only), Instructions (full CRUD)
- [x] Share-to-2brn ingest + Saved screen
- [x] Dark/light theming, offline/empty/error/loading states, accessibility labels
- [x] CI (typecheck + lint + test), mock mode, BUILD/PAIRING docs

---

## Layer 2 — On-device brain (current focus)

A self-sufficient pipeline that runs entirely on the phone, using a single toolkit
(`react-native-executorch`) for OCR, speech-to-text, embeddings, and the LLM.

### Phase 0 — Foundation: local store + embeddings + search ✅
- [x] `src/db/local.ts` — expo-sqlite store (memories + embedding blobs, WAL, migrations)
- [x] On-device embeddings (all-MiniLM-L6-v2, 384-dim) via `EmbeddingsContext`
- [x] Pure ranking logic (`similarity.ts` cosine, `search.ts`) — unit-tested
- [x] Route the share-sheet + quick notes into the **local** store, embedded on save
- [x] Semantic-search UI over saved memories — fully offline
- [x] **Verified on-device** (embeddings + search run on real hardware)

### Phase 1 — Image (OCR) & voice (STT) capture ✅
- [x] On-device OCR (`OCR_ENGLISH`) via `OcrContext`; reading-order assembly (`ocrText.ts`, tested)
- [x] Image capture (expo-image-picker) → OCR → editable note
- [x] Voice capture (expo-audio, 16 kHz mono) → Whisper tiny EN via `SttContext`; waveform assembly tested
- [x] **Verified on the OnePlus 15** (2026-06-13) — OCR + STT run on real hardware; the emulator `SIGILL` was emulator-only

### Phase 2 — On-device LLM (answers + enrich) ✅
- [x] Llama 3.2 1B (SpinQuant) via `LlmContext`; RAG prompt (`prompt.ts`, tested)
- [x] Ask → grounded answer from local search hits (on-device RAG)
- [x] Opt-in auto-enrich: one-line summary + topic tags on new captures (`enrich.ts`, lenient parser tested)
- [x] **Verified on the OnePlus 15** (2026-06-13) — LLM answers + enrich run on real hardware (no `SIGILL`)

### Phase 3 — Companion sync + polish 🟦
- [x] On-device-first landing — an unpaired phone lands on the on-device home, not the pair screen
- [ ] Two-way **memory sync** with the desktop over the LAN (pull desktop activities; push phone captures)
- [ ] Lightweight on-device daily mobile-journal
- [ ] Dedupe, OEM battery-exemption onboarding

---

## Current status

The **companion layer is complete**. The **on-device brain is built and verified through Phase 2** —
capture (note/share/image/voice), embeddings, semantic search, grounded LLM answers, and
opt-in enrichment all run **on real hardware**: verified on the **OnePlus 15** (model `CPH2745`,
Android 16/API 36, `arm64-v8a`) on 2026-06-13, with no `SIGILL` (the crash was emulator-only — the
Apple-Silicon AVD falsely advertises SVE). Phase 3 (two-way memory sync) is the next build.

**Owner / device follow-ups:** produce a signed release build (real keystore + R8 — see
[`BUILD.md`](./BUILD.md)); then Phase 3 sync.
