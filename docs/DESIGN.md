# 2brn Mobile — Design & Architecture

> Status: **active build.** This is the source-of-truth design doc. The architecture
> decision that shapes it (fully on-device, desktop optional) is recorded in
> [`PARITY.md` Part 6](./PARITY.md#part-6--decided-architecture); see [`ROADMAP.md`](./ROADMAP.md)
> for phased progress and [`DECISIONS.md`](./DECISIONS.md) for the running decision log.

## 1. Context

[2brn](https://github.com/SasidharanGS/2brn) is a local-first "second brain" **desktop**
app: it captures the screen every ~60s → OCR (Tesseract) → an LLM infers an activity
summary/category/state → embeds into ChromaDB and stores in SQLite under `~/.2brn/`, and on
top offers RAG chat, an auto-generated journal + blog, insights, and a plugin system. It is
Electron + a Python/FastAPI daemon on `127.0.0.1:7842` (loopback-only, bearer-token auth).

### The constraint that shaped the mobile design

The desktop's defining capability — **always-on background screen capture → OCR →
inference** — **cannot be replicated on Android**:

- Google Play policy prohibits apps that continuously record the screen in the background;
  `MediaProjection` requires a persistent, user-visible session and per-session re-consent,
  and the `AccessibilityService` workaround is a documented ban risk.
- Continuous capture + OCR + LLM inference would destroy battery and fights the OS's
  background-execution limits.

We considered three responses (full analysis in [`PARITY.md`](./PARITY.md) Parts 4–6):
**(A) thin LAN client** — the phone is just a remote UI, useless when the desktop is off;
**(B) hybrid** — the phone captures and does light work but offloads heavy inference; and
**(C) fully on-device** — the phone runs the whole light pipeline itself.

**Decision (owner, 2026-06): option C — a fully _on-device_ second brain, with the desktop
as an optional companion.** Because the target is a single modern flagship phone, we drop
device-tiering and any cloud/desktop inference fallback — the phone is self-sufficient. The
*only* thing we still don't attempt is continuous all-app screen capture; the phone captures
its **own** signals instead (notes, shares, images, voice).

## 2. Product strategy (decided)

**On-device first; the desktop is an optional sibling.**

1. **On-device brain** — capture → OCR / speech-to-text → embed → store → semantic search →
   grounded LLM answers, all on the phone. This works with **no desktop and no network**.
2. **Optional companion** — when a desktop is paired on the same LAN, the phone can *also*
   view the desktop's data (chat, journal, blog, insights, timeline) and sync shared notes
   into it. This is **additive and never required**; nothing on-device depends on it.

Everything is **additive-only**, **local-first**, and **degrades gracefully**: a capture is
always saved locally first; a missing model, an unreachable desktop, or an offline network
never loses data or crashes the app.

## 3. Technology choices (decided)

| Concern | Choice | Why |
|---|---|---|
| Framework | **React Native + Expo** (dev-client / CNG) | Reuses the maintainer's React/TS skills and the typed API contract; native UX; EAS/Gradle builds; iOS reachable later. |
| Routing | **expo-router** (file-based) | Deep-linking for free (pairing + share intents). |
| **On-device ML** | **`react-native-executorch`** | **One toolkit** for OCR, speech-to-text, embeddings, **and** the LLM — far simpler than stitching ML Kit + ONNX + a separate LLM runtime. Models run via Meta's ExecuTorch. |
| LLM | **Llama 3.2 1B (SpinQuant)** | ~1 GB, mobile-optimized quantization; good quality/size/speed for grounded answers over short note context. One constant to swap (`src/ml/llm.ts`). |
| Embeddings | **all-MiniLM-L6-v2** (384-dim) | Small, fast, well-understood sentence embeddings; runs on-device. |
| OCR / STT | **OCR_ENGLISH / Whisper tiny (EN)** | English text-from-image and 16 kHz voice transcription, on-device. |
| Local store | **expo-sqlite** (WAL) | The memories table *and* the vectors live on the phone; start simple, no native vector DB needed at personal scale. |
| Vector search | **cosine similarity in JS** | A few hundred–thousand personal notes rank in milliseconds; avoids a native dependency. Revisit (`sqlite-vec` / ObjectBox) only if scale demands it. |
| Server state (companion) | **TanStack Query** | Caching/retries for the optional desktop endpoints. |
| Styling | **NativeWind v4** (Tailwind for RN) | Shared design tokens with desktop. |
| Secure storage | **expo-secure-store** (Android Keystore) | Stores the pairing token at rest; never in plain files. |
| Capture | **expo-share-intent · expo-image-picker · expo-audio · expo-camera** | Share-sheet, images (→OCR), voice (→STT), and QR (pairing). |
| Streaming (companion chat) | **`expo/fetch`** | RN's global `fetch` can't stream a body; `expo/fetch` can, with a buffered fallback. |
| Testing | **jest-expo** | Pure-logic unit tests (see §7). |

Node is pinned to `.nvmrc` (Node 22 LTS). Android `applicationId`: `com.twobrn.mobile`
(package segments can't start with a digit, so "2brn" → "twobrn"). Deep-link scheme:
`twobrn://`. Display name: **2brn**.

## 4. Architecture

```
┌──────────────────────────── Android phone (self-sufficient) ────────────────────────────┐
│  2brn (React Native / Expo)                                                              │
│                                                                                          │
│  ON-DEVICE BRAIN                                                                         │
│   capture: app/memories.tsx (notes·image·voice) · app/share.tsx (share sheet)            │
│      │                                                                                   │
│      ├─ OCR (image)  ─┐                                                                   │
│      ├─ STT (voice)  ─┤  react-native-executorch  (src/ml/{ocr,stt,embeddings,llm}.ts)   │
│      ▼                ▼                                                                   │
│   embed (MiniLM 384d) ──► src/db/local.ts (expo-sqlite: memories + embedding blob)       │
│      ▲                                  │                                                 │
│      │  ask                             ▼                                                 │
│   LLM answer ◄── rank (cosine, src/ml/{similarity,search}.ts) ◄── query embedding         │
│                                                                                          │
│  OPTIONAL COMPANION (only when a desktop is paired)                                       │
│   expo-router tabs: Home · Chat · Journal · Insights · More(Blog/Timeline/…)             │
│   ConnectionContext { baseUrl, token } ◄── expo-secure-store (Android Keystore)          │
│   src/api/{client,sse,types}.ts  (typed fetch + bearer + SSE streaming)                  │
└───────────────────────────────────────┬──────────────────────────────────────────────────┘
                                         │  HTTP over home Wi‑Fi (LAN), bearer token (opt-in)
┌────────────────────────────────────────▼──────────────────────────────────────────────────┐
│  Existing Python/FastAPI desktop daemon  (mobile-bridge merged to main, off by default)     │
│   • lan_access flag → bind 0.0.0.0 instead of 127.0.0.1 (OFF by default)                   │
│   • GET /connection-info → LAN URLs (for the desktop QR)                                     │
│   • POST/GET/DELETE /ingest/note(s) → embed shared notes + a shared_notes table             │
│   • everything else unchanged: /status /chat /journal /blog /insights /timeline …          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Module layout (`app/` for routes, `src/` for everything else)

```
app/
  _layout.tsx          root providers (QueryClient, Theme, Connection, the 4 ML providers)
  memories.tsx         ON-DEVICE HOME: capture (note/image/voice) · search · ask
  share.tsx            share-intent landing → OCR an image → save on-device (+ optional sync)
  pair.tsx             QR scan + manual entry (pair the optional desktop)
  (tabs)/_layout.tsx   bottom tab bar (companion surfaces)
  (tabs)/index.tsx     Home: desktop status, today's summary, quick actions
  (tabs)/chat.tsx      streaming RAG chat against the desktop
  (tabs)/journal.tsx   desktop journal (date-scoped markdown, regenerate)
  (tabs)/insights.tsx  desktop insights (day/week/month)
  (tabs)/more.tsx      menu → blog · timeline · instructions · saved · settings
  more/*.tsx           blog · timeline · instructions(CRUD) · saved · settings
src/
  ml/         model choices (llm·embeddings·ocr·stt) + PURE logic (similarity·search·
              prompt·enrich·ocrText·audioWaveform) + 4 React contexts (one per model)
  db/         local.ts — expo-sqlite store (memories, embeddings, migrations)
  api/        types.ts · client.ts · sse.ts · mock.ts · queryKeys.ts · queryClient.ts
  connection/ ConnectionContext.tsx · pairing.ts (parse/validate QR + test)
  hooks/      queries.ts (TanStack Query wrappers for the companion endpoints)
  components/ Screen · ui · states · DateBar · SegmentedControl · Markdown · MarkdownDocView · Header
  settings/   prefs.ts (on-device preferences, e.g. auto-enrich opt-in)
  theme/      colors.ts (category/state chip tokens, ported from desktop)
  utils/      date.ts (local-day + UTC-aware time helpers)
```

### 4.2 On-device ML design — pure logic vs. native models

The single most important pattern in the repo: **each model module isolates the one
`react-native-executorch` import and exposes only a constant** (`llm.ts`, `embeddings.ts`,
`ocr.ts`, `stt.ts`). All real logic is **native-free and unit-tested in Node**:
`similarity.ts` (cosine), `search.ts` (ranking), `prompt.ts` (RAG prompt), `enrich.ts`
(summary/tags prompt + lenient parser), `ocrText.ts` (reading-order assembly),
`audioWaveform.ts`. The native models are reached only through hooks, so each lives behind a
**React context** (`EmbeddingsContext`, `OcrContext`, `SttContext`, `LlmContext`) that owns
the instance, exposes ready/progress/error, and lazy-loads on first use (embeddings load
eagerly because search needs them immediately). This keeps inference testable and makes the
model choice a one-line change.

### 4.3 Local store

`src/db/local.ts` is an `expo-sqlite` store (WAL) holding each memory's text, optional
title/source/tags/summary, source kind, timestamp, and its embedding as a blob. Migrations
add columns additively. Search loads candidate embeddings and ranks them with cosine
similarity in JS — simple and fast at personal scale.

### 4.4 Connection & pairing (optional companion)

The desktop daemon is loopback-only and bearer-token-authed, so pairing is **opt-in** and
**local-first**:

1. **Desktop** enables **LAN access** (rebinds to `0.0.0.0`; off by default) and shows a
   **QR code** encoding the pairing payload.
2. **Payload:** a deep link `twobrn://pair?u=<encodeURIComponent(http://LAN_IP:7842)>&t=<token>`.
   The scheme is `twobrn` because URI schemes can't start with a digit (RFC 3986); the URL is
   URI-encoded so it decodes with the built-in `decodeURIComponent` (no `atob` polyfill).
3. **Mobile** scans (or types URL + token), validates via public `GET /status` then an authed
   call, and stores `{baseUrl, token}` in **expo-secure-store**. `useApi()` throws when
   unpaired, so companion screens are type-safe-gated.
4. **Health:** a lightweight `/status` poll drives a calm "connected / unreachable" banner.

**Security posture:** transport is plain HTTP over the LAN; the gate is the per-machine
bearer token. LAN binding is opt-in/off-by-default. The token lives only in the Keystore-
backed secure store and is sent only to the paired base URL. Documented future hardening:
self-signed TLS + cert pinning, or a relay/Tailscale for off-LAN.

### 4.5 Streaming chat transport (companion)

The desktop streams `data: {"chunk": "..."}` lines. RN's global `fetch` lacks a streaming
body, so chat uses **`expo/fetch`** (`src/api/sse.ts` `SSEParser` is a unit-tested
incremental parser). If streaming is unavailable it falls back to a buffered read, so chat
always works.

## 5. Desktop bridge (already merged, opt-in)

The daemon-side support for the optional companion was added **additively and is merged into
the desktop's `main`** (off by default — zero behavior change unless `lan_access` is
enabled): `lan_access` config + `0.0.0.0` bind; `GET /connection-info`; `POST/GET/DELETE
/ingest/note(s)` (embed shared notes into ChromaDB `note_memories` + a `shared_notes` table,
degrading gracefully when embeddings are offline); `lan_access` surfaced in `/settings`; and a
terminal pairing helper (`python -m brn_daemon.pair`). Native RN clients send no browser
`Origin`, so CORS is unaffected; the bearer token is the gate.

## 6. Feature scope

**On-device (the primary experience):** capture (note · share sheet · image→OCR · voice→STT),
on-device embeddings + semantic search, grounded LLM answers (on-device RAG), opt-in
auto-enrich (summary + tags), local SQLite store, dark/light theming, loading/empty/error
states.

**Companion (optional, when paired):** Home/status, streaming Chat, Journal (read +
regenerate), Blog (read), Insights (day/week/month), Timeline (read-only), Instructions
(CRUD), Saved items, Settings (connection mgmt, pause toggle, read-only provider info),
Share-to-2brn sync.

**Deferred / not built:** two-way memory sync between phone and desktop (Phase 3 — see
[`PHASE-3.md`](./PHASE-3.md)); a desktop "Connect a phone" QR panel (the terminal helper
covers pairing); iOS.

## 7. Quality, testing & build

- **Type safety:** TypeScript strict; `tsc --noEmit` clean.
- **Lint/format:** ESLint (expo) + Prettier clean.
- **Tests (jest-expo):** pure logic is unit-tested — cosine similarity, ranking, SSE framing,
  pairing parse/validate, enrichment parsing, OCR reading-order, and date math. **Component
  render tests are deferred**: `@testing-library/react-native` v14 `render()` returns `{}` on
  this React 19 / RN 0.85 / jest-expo stack (see [`DECISIONS.md`](./DECISIONS.md)). The highest-
  ROI direction is to push screen logic down into pure functions/hooks and test those, plus
  exercise the SQLite store against a temp DB.
- **Dev harness:** `EXPO_PUBLIC_MOCK=1` backs every companion screen with fixtures (used by
  tests and `npm run web`).
- **On-device verification:** OCR/STT/LLM **must be verified on a physical device** — they
  crash with `SIGILL` on the Apple-Silicon emulator (which mis-advertises SVE). `expo export`
  proves the app *bundles*, not that inference *runs*.
- **CI:** GitHub Actions — typecheck + lint + test on push/PR.
- **Build (Android):** `npx expo prebuild -p android` then `./gradlew assembleRelease` (with
  the Android SDK + JDK 17), or `eas build -p android --profile preview` (cloud). See
  [`BUILD.md`](./BUILD.md). `android/` and `ios/` are git-ignored (Continuous Native
  Generation) — change native config in `app.json`, not the generated folders.

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| On-device inference unverified (emulator `SIGILL`) | Treat physical-device verification as the definition of done for OCR/STT/LLM; scope public claims to what's verified (search). |
| Large model downloads (~1 GB LLM) | Lazy-load on first use; show download progress; auto-enrich is opt-in and off by default. |
| RN streaming fetch quirks (companion chat) | `expo/fetch` + buffered fallback; covered by a parser unit test. |
| Native modules need a dev build (no Expo Go) | Use a dev-client/prebuild build; mock mode covers UI review without one. |
| Plain-HTTP LAN transport (companion) | Opt-in/off-by-default + bearer token; future TLS/relay documented. |
| Node version vs. Expo tooling | Pin Node 22 LTS via `.nvmrc`. |

## 9. Non-goals

- **Continuous all-app screen capture** in the public app (Play policy + battery). If the
  owner personally wants phone-screen history, ship it as a separate, sideloaded "personal
  mode" build — never the public one.
- **Cloud or desktop inference fallback / device-capability tiering** — the phone is
  self-sufficient on the target device; that simplification is deliberate.
- **MCP plugins** on mobile — Android can't fork arbitrary local processes; stays desktop-only.
- **Editing AI provider settings / secrets on the phone** — the companion shows provider info
  read-only; secrets stay on the desktop.
- **Replacing the desktop, a cloud service, or multi-user.** Android-only for now (iOS reachable).
