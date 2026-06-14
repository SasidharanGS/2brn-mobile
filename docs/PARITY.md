# 2brn — Desktop ↔ Mobile Feature Parity & Mobile Strategy

> **Purpose.** A single source of truth for (1) **every feature** in the 2brn desktop app and
> the mobile companion, (2) a **parity matrix** you can check against over time, and (3) a
> researched **strategy** for how far the phone can realistically go toward doing what the
> desktop does — and the best architecture to get there.
>
> Companion docs: [`HANDOFF.md`](../HANDOFF.md) (status/branches), [`DESIGN.md`](./DESIGN.md),
> [`ROADMAP.md`](./ROADMAP.md), [`BUILD.md`](./BUILD.md), [`PAIRING.md`](./PAIRING.md), and the
> bridge contract in `2brn_desktop/docs/mobile-bridge.md`.
>
> _Last updated: 2026-06-11._
>
> **Implementation status (update):** the on-device pipeline below has since been **built
> through Phase 2** (capture → OCR/STT → embeddings → SQLite → semantic search → grounded
> LLM answers). The chosen stack is a **single toolkit, `react-native-executorch`**, for OCR,
> speech-to-text, embeddings, **and** the LLM — **not** the ML Kit + ONNX + `llama.rn`
> combination explored in Parts 5/7/8 — with **Llama 3.2 1B (SpinQuant)** as the LLM (not
> Gemma; executorch ships no Gemma) and **all-MiniLM-L6-v2** for embeddings, over
> **expo-sqlite + JS cosine**. [`DESIGN.md`](./DESIGN.md) and the code in `src/ml/` are
> canonical for the tech; treat Parts 5/7/8 here as the original research.

---

## TL;DR — read this first

- **Originally**, the desktop was the whole brain and the phone was a **thin LAN client** that
  viewed/controlled it over HTTP plus one capture source (the Android **"Save to 2brn"** share
  sheet). That companion layer still exists, but **the phone now runs its own on-device brain**
  (capture → OCR/STT → embeddings → semantic search → grounded LLM answers); the desktop is optional.
- **You asked: can the phone do everything the desktop does?** Researched answer: **almost — but not
  the one feature that defines the desktop.** OCR, embeddings, vector search, and *short* AI
  inference all run fine on a modern Android phone. **Continuous, always-on screen capture of other
  apps does _not_ translate** — not for technical reasons but because of Android platform limits +
  Google Play policy (it's treated as sensitive data; the "read the screen" workaround via
  AccessibilityService is a documented ban risk).
- **Decided architecture (2026-06): fully _on-device_, with the desktop as an optional companion.**
  The phone runs the whole light brain itself — mobile-native capture → on-device OCR/STT → a **small
  local LLM (Llama 3.2 1B, SpinQuant)** that tags & answers → an on-phone vector memory — so it works standalone with
  **no cloud and no offload**. It stays a **companion**: when paired on the same Wi-Fi it still
  syncs/views the desktop's memory (additive, not required). Target device: **OnePlus 15**; supporting
  weaker phones is a non-goal. Full design in [Part 6](#part-6--decided-architecture).
- **Do NOT** try to ship continuous all-app screen capture in a public Play Store app. If the owner
  personally wants phone-screen history, ship it as a **separate, sideloaded "personal mode"** build.

---

## How to use the parity matrix

The matrix in [Part 3](#part-3--feature-parity-matrix) is the checkable artifact. Columns:

| Column | Meaning |
|---|---|
| **Desktop** | ✅ has it / — none |
| **Mobile (today)** | ✅ full · ◑ partial · ⬚ view-only · — absent |
| **On-device feasible?** | Can the phone do this _itself_ (no desktop)? **Yes / Partial / No** — with the why |
| **Target** | Where it should land in the [roadmap](#part-7--phased-roadmap): P0–P3, or _stays desktop-only_ |

Legend for feasibility is grounded in [Part 5 (research)](#part-5--can-the-phone-do-the-full-pipeline-researched-verdicts).

---

## Part 1 — How the two apps connect today

```
Android app (2brn_mobile, Expo/RN)                 Desktop daemon (2brn_desktop, FastAPI :7842)
  expo-router tabs:                                   continuous pipeline + scheduler:
    Home · Chat · Journal · Insights · More           • screen capture (mss, all monitors, ~60s)
    More → Blog · Timeline · Instructions ·           • OCR (Tesseract)
           Saved · Settings                           • AI inference (litellm → cloud or local Ollama)
  + pair (QR) + share ("Save to 2brn")                • embeddings → ChromaDB (RAG)
                                                       • journals / blog / insights (APScheduler)
  src/api/{client,sse,mock,types}.ts  ──HTTP/SSE──►    • MCP plugin system
  bearer token in Android Keystore                     • SQLite + screenshots under ~/.2brn
  (expo-secure-store)                                  • opt-in lan_access → bind 0.0.0.0
```

- The phone reaches the daemon only when `lan_access: true` and both are on the same LAN.
- Auth is a bearer token paired via QR (`python -m brn_daemon.pair` → app scans).
- The phone **consumes** desktop data and **contributes** shared notes; it currently runs **no**
  capture/OCR/inference/RAG of its own.

---

## Part 2 — Full feature inventories

### 2A. Desktop app (`2brn_desktop`) — what exists

**User-facing screens** (`ui/src/components/`):

| Screen | What it does |
|---|---|
| **Home / Dashboard** | Quick-ask chat box + tiles to Journal/Timeline/Insights/Settings |
| **Chat** | RAG chat over activities + notes; **SSE streaming**; category + date filters |
| **Journal** | View/generate/edit AI daily journal; edit the daily journal **schedule** |
| **Blog** | View/generate/edit AI public "dev log"; configure blog **schedule** (daily/weekly/monthly) |
| **Timeline** | Chronological inferred activities; filter by category/state; search; **override** category/state |
| **Insights** | Dashboards (recharts): category pie, state breakdown, top apps, **hourly heatmap**, day/week/month, **comparison vs baseline**, recurring-activity clusters |
| **Instructions** | CRUD natural-language rules injected into inference/journal/blog prompts; enable/disable |
| **Plugins** | Register **MCP servers**, introspect tools, write NL automation rules, "Run now", execution history, health |
| **Settings** | Chat & embed **providers + API keys**, capture interval, purge months, **LAN access toggle**, Joplin, **screenshot encryption** (set/change/disable), **app exclusions**, **ChromaDB re-sync** + status |
| _Shared UI_ | StatsBar ("now" chip + theme toggle), DaemonStatus (pause/resume), CalendarPanel (shared date), DebugPanel (logs + `/debug/status`) |

**The core pipeline** (`daemon/src/brn_daemon/`):

| Stage | Implementation |
|---|---|
| **Capture** | `capture.py` — `mss` grabs **all monitors**; foreground app/window via AppKit/Quartz (mac), pygetwindow (Win), xdotool (Linux). Heartbeat every `capture_interval_seconds` (**60s**) + on-change (perceptual hash, `imagehash.whash`). App-exclusion aware. JPEG to `~/.2brn/screenshots/…`, optional **AES-256-GCM** encryption |
| **OCR** | `ocr.py` — **Tesseract** via `pytesseract`; sparse-text captures skip inference |
| **Inference** | `inference.py` + `llm.py` — **`litellm`** to any OpenAI-compatible endpoint (cloud **or** local Ollama/LM Studio). 5 concurrent workers, queue cap 500. Produces structured JSON: `summary`, `tags[]`, `task_category`, `productivity_state`, confidences. User **instructions** appended to prompt |
| **Embeddings + RAG** | `embeddings.py`, `chat.py` — **ChromaDB** (`~/.2brn/chroma`), collections `activity_memories` + `note_memories`; configurable embed provider; retrieval w/ cosine cutoff; RAG prompt → streamed answer |
| **Scheduling** | `main.py` lifespan — capture loop, inference workers, **APScheduler** crons: journal (21:00), blog, purge (02:00). Startup backfill for missed journal/blog |

**Data & storage:** `~/.2brn/` → `2brn.db` (SQLite/WAL), `chroma/`, `screenshots/`, `config.json`,
`encryption.json`, `api_token` (0600). Tables: `captures`, `activities`, `journals`, `blog_posts`,
`user_instructions`, `app_exclusions`, `plugins`, `plugin_rules`, `plugin_rule_executions`,
`shared_notes`. **Secrets live only in the OS keychain.**

**HTTP API surface** (token-gated except `GET /status`): `/status`, `/logs`, `/debug/status`;
`/captures`, `/captures/{id}/image`; `/activities`, `/activities/{id}/override`; `/chat` (SSE);
`/journal/{date}` (GET/POST generate/PUT); `/blog/{date}` (GET/POST/PUT);
`/insights/daily|summary|weekly`; `/instructions` CRUD; `/settings` (GET/PUT), `/settings/paused`,
`/settings/exclusions`, `/settings/resync-chroma`, `/settings/chroma-status`,
`/settings/screenshot-password`; `/plugins` + `/plugin-rules` (CRUD/run/executions);
`/connection-info`; `/ingest/note(s)`.

**Runs as:** Electron-spawned, supervised FastAPI daemon (auto-restart, 5s health poll). Autostart
is **macOS-only** (launchd plist); no tray, no Windows/Linux autostart.

### 2B. Mobile app (`2brn_mobile`) — what exists today

> **Note (2026-06):** the inventory below describes the original *companion* surface. Since
> then the **on-device brain** (Phases 0–2) has been built — the phone now does its own
> capture, OCR, STT, embeddings, semantic search, and LLM answers (see the status banner up
> top and [`DESIGN.md`](./DESIGN.md)). The "pure client / no inference of its own" lines below
> are historical.

**Screens** (`app/`): Home (`(tabs)/index`), Chat (`(tabs)/chat`), Journal, Insights, More →
{Blog, Timeline, Instructions, Saved, Settings}; plus `pair.tsx` (QR + manual pairing) and
`share.tsx` ("Save to 2brn" compose/confirm).

**What the phone can actually do** (exact API surface, `src/api/client.ts`):

| Capability | Mobile support |
|---|---|
| Daemon status | ✅ polled every 30s |
| Connection info | ✅ |
| Activities / Timeline | ✅ list + filter; ✅ **override** category/state (`PATCH /activities/{id}/override`) |
| Chat (RAG) | ✅ **SSE streaming** via `expo/fetch` |
| Journal | ✅ view / generate / edit |
| Blog | ✅ view / generate / edit |
| Insights | ✅ day/week/month summary (heatmap, comparison, recurring) |
| Instructions | ✅ **full CRUD** |
| Shared notes ("Saved") | ✅ list + delete; **Share-to-2brn** ingest (Android share sheet) |
| Settings | ◑ **mostly view-only**: shows providers/interval/encryption; **only interactive control = pause/resume capture**; + Disconnect (unpair). Explicitly defers provider/secret editing to desktop |
| Pairing | ✅ QR scan + manual; token in Android Keystore |
| Mock mode | ✅ `EXPO_PUBLIC_MOCK=1` backs every screen with fixtures |

**What the phone does _not_ have (vs desktop):**
- **No Plugins / MCP** screen or endpoints at all.
- **No write access to Settings** beyond pause: can't edit providers/API keys, capture interval,
  purge, LAN toggle, Joplin, schedules, app exclusions, encryption, or trigger ChromaDB re-sync.
- **No capture image viewer** (no use of `/captures/{id}/image`), no DebugPanel/logs.
- **No capture / OCR / inference / embeddings / RAG of its own** — it is a pure client.

**Mobile-only (not on desktop):** QR pairing + secure-token storage; the Android **share-sheet
capture target**; mock mode.

---

## Part 3 — Feature parity matrix

> ✅ full · ◑ partial · ⬚ view-only · — absent. "On-device feasible?" = can the phone do it itself
> without the desktop (see [Part 5](#part-5--can-the-phone-do-the-full-pipeline-researched-verdicts)).

### Viewing / control features (already exposed as HTTP APIs)

| Feature | Desktop | Mobile (today) | On-device feasible? | Target |
|---|:---:|:---:|---|---|
| Chat (RAG, streaming) | ✅ | ✅ | **Yes** — on-device retrieval + answers from the local **Gemma** LLM | P2–P3 (on-device) |
| Journal (view/gen/edit) | ✅ | ✅ | **Yes** — view now; generation via on-device Gemma | P3 |
| Blog (view/gen/edit) | ✅ | ✅ | **Yes** — same as journal (on-device Gemma) | P3 |
| Timeline + override | ✅ | ✅ | Yes (over local cache) | P0 |
| Insights dashboards | ✅ | ✅ | Yes (compute over local cache) | P0/P3 |
| Instructions CRUD | ✅ | ✅ | Yes | P0 |
| Daemon status / pause | ✅ | ✅ | n/a (controls desktop) | stays client |
| Settings (full edit) | ✅ | ◑ view-only | Yes for local settings | P1 |
| Plugins / MCP | ✅ | — | **No** — can't fork local processes on Android | stays desktop-only |
| Capture image viewer | ✅ | — | n/a | optional |
| Debug panel / logs | ✅ | — | Yes | optional |

### The capture → enrich → store pipeline (the hard part)

| Pipeline stage | Desktop | Mobile (today) | On-device feasible? | Target |
|---|:---:|:---:|---|---|
| **Continuous all-app screen capture** | ✅ (mss, every 60s) | — | **No (public app)** — MediaProjection forces consent dialog + persistent cast indicator + per-session re-consent; AccessibilityService is a Play **ban risk**; screen recording = sensitive data. _Personal sideloaded build only._ | sideloaded "personal mode" only |
| Mobile-native capture (notifications, share-sheet, foreground-app/usage, manual shots, voice) | — (can't see phone) | ◑ share-sheet only | **Yes** — this is what the phone *uniquely* can capture | **P1** |
| **OCR** | ✅ Tesseract | — | **Yes** — **ML Kit Text Recognition v2** (free, offline, ≥ Tesseract accuracy) | P1 |
| **AI inference** (summary/tags/category) | ✅ litellm | — | **Yes on the OnePlus 15** — bundle **Gemma 3** (MediaPipe / `llama.rn`) for short tag/summarize/answer; **on-device only, no offload** (decided) | P2 |
| **Embeddings** | ✅ configurable | — | **Yes** — BGE/GTE via **ONNX Runtime Mobile** | P0 |
| **Vector store / RAG index** | ✅ ChromaDB | — | **Yes** — start simple (**expo-sqlite** + JS cosine), grow into **ObjectBox** / **sqlite-vec** for scale. (ChromaDB itself ≠ mobile) | P0 |
| **Scheduled generation** (journal/blog crons) | ✅ APScheduler (60s/daily) | — | **Partial** — **WorkManager** reliable at **≥15 min**, not 60s; true 60s needs a foreground service | P2/P3 |
| Screenshot AES encryption | ✅ | — | Yes (Android Keystore) — only if phone captures images | with personal mode |

### Mobile-only

| Feature | Desktop | Mobile | Notes |
|---|:---:|:---:|---|
| QR pairing + Keystore token | n/a (host) | ✅ | secure LAN client onboarding |
| Android share-sheet capture | ⬚ (ingest API only) | ✅ | the phone's one capture source today |
| Mock mode (demo data) | — | ✅ | dev/preview |

---

## Part 4 — The crux: why "full parity" is really one hard feature

Everything in 2brn flows from **continuous screen capture**. On desktop that's a 60-second
`mss` grab of every monitor with zero friction. On Android the _identical_ behavior is the single
most privacy-sensitive operation the platform supports, gated three ways:

1. **MediaProjection** (the only API to capture other apps): a mandatory **consent dialog**, a
   **persistent non-dismissable cast indicator**, **one active session device-wide**, and since
   Android 14 **per-session re-consent** — you can stream continuously _within_ one session, but any
   interruption (revoke, app kill, reboot) forces a fresh full-screen prompt. Requires a
   **foreground service** of type `mediaProjection` → a **permanent notification**.
2. **AccessibilityService** (read on-screen text instead of pixels): technically attractive, but
   **the canonical Google Play rejection/ban pattern**. 2026 policy bans Accessibility use that
   "autonomously initiates, plans, and executes actions/decisions"; misuse ⇒ "**suspension of your
   app and/or termination of your developer account**." Don't build a public product on it.
3. **Play data policy:** screen recording is **sensitive personal data** requiring prominent
   in-app disclosure + affirmative consent before any collection.

**Net:** match the desktop's _outcomes_, not its _mechanism_. The phone should capture **what only
the phone can see** (notifications, share content, app-usage, manual/voice capture), enrich it
on-device, and (optionally) **sync** with the desktop as a companion — not depend on it.

---

## Part 5 — Can the phone do the full pipeline? (researched verdicts)

| Capability | Verdict | Best option on Android (2026) |
|---|---|---|
| **All-app screen capture (always-on)** | **No** for public app; Partial (personal sideload) | MediaProjection under a foreground service (visible, fragile); never AccessibilityService publicly |
| **OCR** | **Yes** | **ML Kit Text Recognition v2** — free, on-device, offline, ≥ Tesseract accuracy |
| **AI inference (short summarize/classify)** | **Partial** | **Gemini Nano / ML Kit GenAI** on flagships (Pixel 9/10, S25-class); **MediaPipe/Gemma** wider; else **offload** to desktop/cloud. ~10–28 tok/s on flagships; thermal/battery cost ⇒ not every 60s |
| **Embeddings** | **Yes** | BGE/GTE quantized via **ONNX Runtime Mobile** (low RAM, fast) |
| **Vector search / RAG store** | **Yes** | **ObjectBox** (built-in HNSW) _or_ **SQLite + sqlite-vec** (consistent with existing SQLite). ChromaDB is server/Python — not mobile |
| **Background 60s cadence** | **Partial** | **WorkManager** ~94% completion but **≥15-min** floor; 60s needs a foreground service. Redesign cadence: event-driven + ≥15-min periodic |
| **MCP plugins** | **No** | Android can't fork arbitrary local processes — stays desktop-only |

Sources are listed in [Part 9](#part-9--sources). Research artifacts persisted at
`~/Documents/Android_SecondBrain_Research_20260610/`.

---

## Part 6 — Decided architecture

We weighed three options: **(A) Thin client** (status quo — the phone is just a remote UI; useless when
the desktop is off), **(B) Hybrid** (phone captures + does light on-device work but **offloads** heavy
inference to desktop/cloud), and **(C) Full on-device** (phone runs the whole pipeline itself).

**Decision (owner, 2026-06): a simplified _fully on-device_ design.** Because the target is a single
**OnePlus 15** flagship, we deliberately drop the device-tiering and the cloud/desktop **inference
fallback** — they add complexity we don't need. The phone is self-sufficient. The only thing we still
reject from a "full clone" is **continuous all-app screen capture** (Play-policy + battery — see
[Part 4](#part-4--the-crux-why-full-parity-is-really-one-hard-feature)); the phone captures its *own*
signals instead.

### The on-device pipeline (everything on the phone)

```
mobile-native capture → on-device OCR/STT (executorch) → small local LLM (Llama 3.2 1B) tags/summarizes
   → on-phone vector memory (expo-sqlite + JS cosine) → you ask → the same LLM answers
```

The **local LLM is the single engine** for both enriching captures and answering questions; embeddings
are generated on-device (all-MiniLM-L6-v2). All four models — OCR, STT, embeddings, LLM — run through
the one **`react-native-executorch`** toolkit. **Nothing leaves the phone.** This mirrors the desktop
pipeline, shrunk.

### The companion contract (kept — additive, never required)

The phone stays the desktop's **mobile sibling**. When both are paired on the same LAN it can still:

- **View** the desktop's data through the screens that already exist (Chat / Journal / Timeline /
  Insights over HTTP) — the thin-client features built today.
- **Sync memory both ways:** pull the desktop's computer-activity memories down so the phone can
  search/answer over them too, and push the phone's captured phone-life up (extending the existing
  `POST /ingest/note` bridge) so the desktop's journals/insights include phone context.

This sync **enriches** both brains, but the phone **works fully on its own** when the desktop is off or
out of range. Much of the companion layer — pairing, the read screens, note ingest — **already exists**,
so "keep the companion behavior" mostly means *don't remove what's there* and add memory sync later
(Phase 3).

### Explicitly dropped for simplicity

Cloud/desktop **inference fallback**; **device-capability tiering**; **Gemini-Nano-vs-bundle** branching
(we bundle one model — Llama 3.2 1B via executorch). **Still off the table:** continuous screen capture (sideloaded
"personal mode" only) and **MCP plugins** (desktop-only — Android can't fork local processes).

---

## Part 7 — Phased roadmap

> All native work below needs an **Expo Dev Client** build (not Expo Go). You already build these via
> `npm run android`. **Build order matters: foundation first, then slot the LLM in** — the model needs
> data to act on, and you get a working app at every step.

**Phase 0 — On-device capture + memory + search** ✅ _(the foundation; no LLM yet)_ → **detailed plan:
[`PHASE-0.md`](./PHASE-0.md)**
- A **local store** (**expo-sqlite**) + on-device **embeddings** (all-MiniLM-L6-v2 via
  **react-native-executorch**). Route the existing **Save to 2brn** share-sheet into the **local**
  store, embedded on save. A **semantic-search** screen over your saved items — fully offline, no
  generative LLM yet. _Built and verified on-device._
- _Why first:_ de-risks the native bits (device DB + on-device ML) before the LLM, and ships a real,
  self-contained feature. Everything later plugs into this.

**Phase 1 — Broaden mobile-native capture** ✅ _(the phone's unique value)_
- Grow capture beyond the share-sheet: quick notes, voice notes (**Whisper tiny EN** via executorch),
  images. Run **OCR** (executorch `OCR_ENGLISH`) on shared/captured images. _Built and verified on the
  OnePlus 15 (2026-06-13) — OCR + STT run on real hardware; the emulator `SIGILL` was emulator-only._
  (Notifications / app-usage capture remain future work; periodic work would use **WorkManager ≥15 min**
  + event triggers.)

**Phase 2 — The local LLM engine** ✅ _(on-device, Llama 3.2 1B)_
- Bundle **Llama 3.2 1B (SpinQuant)** via **react-native-executorch** (executorch 0.9 ships no Gemma).
  On capture → tag + one-line summary (opt-in). On a question → write a short answer from the local
  search hits. This upgrades Phase 0's "search" into real **ask & answer**, all on-device. _Built and
  verified on the OnePlus 15 (2026-06-13) — LLM answers + enrich run on real hardware (no `SIGILL`)._

**Phase 3 — Companion sync + polish** 🟦 _(the desktop tie-in)_
- On-device-first landing is done (an unpaired phone lands on the on-device home). Still to do: two-way
  **memory sync** with the desktop over the LAN (pull desktop activities; push phone captures via
  `POST /ingest/note`); lightweight on-device daily mobile-journal; dedupe, offline/empty states,
  OEM battery-exemption onboarding.

**Avoid / defer:** continuous all-app screen capture in the public app; AccessibilityService screen
reading; any design assuming reliable sub-15-min background cadence. **MCP plugins stay desktop-only.**

---

## Part 8 — React Native / Expo building blocks

> **What was actually chosen** (see [`DESIGN.md`](./DESIGN.md)): a single toolkit,
> **`react-native-executorch`**, covers OCR, STT, embeddings, and the LLM — replacing the
> separate ML Kit / ONNX / `llama.rn` picks first listed here. The vector store stayed
> **expo-sqlite + JS cosine**. Rows are kept for context and future options.

| Need | Chosen / option | Notes |
|---|---|---|
| Dev builds | **Expo Dev Client** (`npm run android`) | required for all native modules |
| OCR | ✅ **react-native-executorch** (`OCR_ENGLISH`) | one toolkit for all on-device models |
| Speech-to-text | ✅ **react-native-executorch** (`WHISPER_TINY_EN`) | 16 kHz mono |
| On-device LLM | ✅ **react-native-executorch** (`LLAMA3_2_1B_SPINQUANT`) | executorch ships no Gemma; swap one constant for Qwen/Phi/3B |
| Embeddings | ✅ **react-native-executorch** (`all-MiniLM-L6-v2`, 384-dim) | replaced the ONNX BGE/GTE plan |
| Vector store | ✅ **expo-sqlite + JS cosine** | ObjectBox / `sqlite-vec` only if scale demands it |
| Periodic work | _future:_ `expo-background-task` (WorkManager) | ≥15-min floor |
| Notifications capture | _future:_ NotificationListenerService module + disclosure | not yet built |
| (Personal mode) screen capture | _future:_ `react-native-frame-capture` (MediaProjection) | sideload only — see policy caveats |

A first-time mobile dev should plan on ~**2–4 small custom Kotlin modules / config plugins**
(foreground service + capture wiring, ML Kit GenAI) plus the community libs above.

---

## Part 9 — Sources

**Android platform & policy (authoritative, first-party):**
- [Foreground service types are required (Android 14)](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- [Android 14 behavior changes](https://developer.android.com/about/versions/14/behavior-changes-14)
- [Media projection](https://developer.android.com/media/grow/media-projection)
- [Restricted screen reading (AOSP)](https://source.android.com/docs/core/permissions/restricted-screen-reading)
- [Use of the AccessibilityService API (Play policy)](https://support.google.com/googleplay/android-developer/answer/10964491)
- [Prominent disclosure & consent](https://support.google.com/googleplay/android-developer/answer/11150561)
- [Permissions & APIs accessing sensitive info](https://support.google.com/googleplay/android-developer/answer/16558241)

**OCR / on-device AI:**
- [ML Kit Text Recognition v2](https://developers.google.com/ml-kit/vision/text-recognition/v2)
- [On-device GenAI APIs (ML Kit + Gemini Nano)](https://android-developers.googleblog.com/2025/05/on-device-gen-ai-apis-ml-kit-gemini-nano.html)
- [ML Kit GenAI Summarization (limits)](https://developers.google.com/ml-kit/genai/summarization/android)
- [ML Kit GenAI Prompt API (alpha)](https://android-developers.googleblog.com/2025/10/ml-kit-genai-prompt-api-alpha-release.html)
- [MediaPipe LLM Inference (Android)](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/android)
- [LLMs in Your Pockets (arXiv 2410.03613)](https://arxiv.org/html/2410.03613v3)
- [Best Mobile LLM Models 2026 (benchmarks)](https://www.promptquorum.com/power-local-llm/mobile-llm-models-phi4-gemma-smollm)

**Embeddings / vector stores:**
- [ObjectBox On-Device Vector Search](https://docs.objectbox.io/on-device-vector-search)
- [sqlite-vec](https://github.com/asg017/sqlite-vec)
- [On-Device RAG for App Developers (Google GDE)](https://medium.com/google-developer-experts/on-device-rag-for-app-developers-embeddings-vector-search-and-beyond-47127e954c24)

**Background work / RN libraries:**
- [System-Aware Background Task Management (2025)](https://eajournals.org/wp-content/uploads/sites/21/2025/07/System-Aware-Background.pdf)
- [What Android OEMs do to background apps](https://dev.to/stoyan_minchev/what-android-oems-do-to-background-apps-and-the-11-layers-i-built-to-survive-it-28bb)
- [react-native-frame-capture](https://github.com/nasyx-rakeeb/react-native-frame-capture)
- [react-native-mlkit (Infinite Red)](https://github.com/infinitered/react-native-mlkit)

---

## Appendix — Build/environment gotchas discovered

- **`expo prebuild` rewrites tracked files.** A _clean_ prebuild (`expo prebuild --clean`, or the
  first `npm run android` when `android/` is absent) **deletes `expo-env.d.ts` and rewrites
  `tsconfig.json`**, stripping the `expo-env.d.ts` / `.expo/types` includes — which breaks
  `npm run typecheck` (`TS2882` on `import '../global.css'`). After a clean prebuild, restore them:
  `git checkout -- expo-env.d.ts tsconfig.json`. _Incremental_ rebuilds don't trigger this.
- **Launcher icon only regenerates on a clean prebuild.** Editing `app.json`'s `icon` /
  `adaptiveIcon` and running an _incremental_ build won't update the native mipmaps; force
  `expo prebuild -p android --clean` then rebuild.
- Toolchain pinned for this machine: JDK 17 (`/opt/homebrew/opt/openjdk@17`), Android SDK at
  `~/Library/Android/sdk`, emulator `Pixel_8` (API 36). See `JAVA_HOME`/`ANDROID_HOME` in `~/.zshrc`.
