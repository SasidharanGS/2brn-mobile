# 2brn Mobile — Design & Architecture

> Status: **active build**. This is the source-of-truth design doc. See
> [`ROADMAP.md`](./ROADMAP.md) for phased progress and [`DECISIONS.md`](./DECISIONS.md)
> for the running log of autonomous decisions.

## 1. Context

[2brn](../../2brn) is a local-first "second brain" **desktop** app. It captures the
screen every ~60s → OCR (Tesseract) → an LLM infers an activity summary, a task
category and a productivity state → embeds into ChromaDB and stores in SQLite under
`~/.2brn/`. On top of that data it offers RAG **chat**, an auto-generated daily
**journal** + **blog**, **insights**, and a **plugin** system (MCP). The UI is
Electron + React 19 + TypeScript + Tailwind, talking HTTP to a **Python/FastAPI
daemon** on `127.0.0.1:7842` (loopback-only, per-machine **bearer-token** auth).

### The core constraint that shapes everything

The desktop's defining capability — **always-on background screen capture → OCR →
inference** — **cannot be replicated on Android**:

- Google Play policy prohibits apps that continuously record the screen in the
  background; `MediaProjection` requires a persistent, user-visible capture session
  and is intended for active screen-sharing/recording, not silent 24/7 logging.
- Continuous capture + on-device OCR + LLM inference would destroy battery and is
  fighting the OS's background-execution limits.

**Therefore the mobile app is not a port of the capture engine.** The capture
pipeline stays on the desktop. The mobile app's job is to (a) put your existing
second brain in your pocket, and (b) add *mobile-native* ways to feed it.

## 2. Product strategy (decided)

**Hybrid: companion-first, plus one mobile-native capture source.**

1. **Companion** — a secure remote client to the existing desktop daemon. On the go
   you can chat with your second brain (RAG), read the journal/blog, glance at
   insights, and browse the timeline. This reuses the *entire* existing API and is
   the fastest path to a polished, genuinely working app.
2. **One capture source** — an Android **Share-sheet target** ("Save to 2brn").
   Share a web page, a selection of text, or a note from any app into 2brn; it is
   ingested into the same semantic index, so it becomes searchable in chat and shows
   up in your second brain. This starts the mobile-capture story without fighting the
   OS.

Everything is designed **additive-only** and **local-first**, matching the desktop
project's design principles: the mobile app never degrades the desktop, and it
degrades cleanly when the desktop is unreachable.

## 3. Technology choices (decided)

| Concern | Choice | Why |
|---|---|---|
| Framework | **React Native + Expo** (managed + dev-client) | Reuses the maintainer's React/TS skills and the existing typed API contract; native UX; EAS/Gradle builds; clean path to iOS later. Native fetch isn't subject to browser CORS. |
| Routing | **expo-router** (file-based) | Modern Expo default; deep-linking for free (pairing + share intents). |
| Server state | **TanStack Query** | Mirrors the desktop UI; caching, retries, offline-friendly. |
| Styling | **NativeWind v4** (Tailwind for RN) | Reuses the maintainer's Tailwind familiarity; shared design tokens with desktop. |
| Secure storage | **expo-secure-store** (Android Keystore) | Stores the pairing token at rest, never in plain files. |
| QR scan | **expo-camera** (built-in barcode scanning) | Pairing. |
| Share target | **expo-share-intent** (config plugin) | The Android Share-sheet capture source. Requires a dev/prebuild build (not Expo Go). |
| Streaming | **`expo/fetch`** (WHATWG streaming fetch) | RN's global `fetch` can't stream a `ReadableStream` body; `expo/fetch` can, so chat streams token-by-token like the desktop. Falls back to buffered read. |
| Markdown | **react-native-markdown-display** | Journal/blog/chat render markdown. |
| Testing | **jest-expo + @testing-library/react-native** | Unit/component tests; fetch is mocked. |
| Lint/format | **ESLint (expo config) + Prettier** | Matches OSS norms. |

Node: pinned to the repo's `.nvmrc` (Node 22 LTS). Android `applicationId`:
`com.twobrn.mobile` (Java package segments can't start with a digit, so "2brn" →
"twobrn"). Display name: **2brn**.

## 4. Architecture

```
┌────────────────────────────── Android phone ──────────────────────────────┐
│  2brn (React Native / Expo)                                                │
│                                                                            │
│  expo-router tabs:  Home · Chat · Journal · Insights · More                │
│  Share target ─────────────────────────────► POST /ingest/note            │
│                                                                            │
│  ConnectionContext { baseUrl, token }  ◄── expo-secure-store               │
│  api/client.ts  (typed fetch + bearer)  ── api/types.ts (ported contract)  │
│  chatStream.ts  (expo/fetch streaming)                                     │
└───────────────────────────────────┬────────────────────────────────────────┘
                                     │  HTTP over home WiFi (LAN), bearer token
┌───────────────────────────────────▼────────────────────────────────────────┐
│  Existing Python/FastAPI daemon  (additive, opt-in changes on a branch)     │
│   • lan_access flag → bind 0.0.0.0 instead of 127.0.0.1 (OFF by default)    │
│   • GET /connection-info → LAN URLs (for the desktop QR)                     │
│   • POST /ingest/note → embed shared content into ChromaDB note_memories    │
│                          + persist to a new shared_notes table              │
│   • everything else unchanged: /status /chat /journal /blog /insights …     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 App module layout (in `app/` for routes, `src/` for everything else)

```
app/
  _layout.tsx          root providers (QueryClient, Theme, Connection), gate
  index.tsx            redirect: paired → /(tabs) ; else → /pair
  pair.tsx             QR scan + manual entry
  (tabs)/_layout.tsx   bottom tab bar
  (tabs)/index.tsx     Home: daemon status, today's summary, quick actions
  (tabs)/chat.tsx      streaming RAG chat
  (tabs)/journal.tsx   journal (date-scoped, markdown, regenerate)
  (tabs)/insights.tsx  insights (day/week/month)
  (tabs)/more.tsx      menu → blog, timeline, instructions, saved, settings, about
  more/blog.tsx        blog (date-scoped, markdown)
  more/timeline.tsx    captures/activities for a date (read-only)
  more/instructions.tsx user instructions (CRUD)
  more/saved.tsx       items saved via the share sheet
  more/settings.tsx    connection mgmt, pause toggle, provider info (read-only), about
  share.tsx            share-intent landing → confirm → ingest
src/
  api/        types.ts · client.ts · chatStream.ts · queryKeys.ts
  connection/ ConnectionContext.tsx · pairing.ts (parse/validate QR + test)
  hooks/      useStatus · useJournal · useBlog · useInsights · useChat · …
  components/ Card · Button · Markdown · DateBar · Stat · EmptyState · ErrorState …
  theme/      tokens.ts (mirror desktop utils/design.ts) · nativewind config
  utils/      date/local-day helpers, formatting
```

### 4.2 Connection & pairing

The daemon is loopback-only and bearer-token-authed, so a phone cannot reach it out
of the box. Pairing is **opt-in** and stays **local-first**:

1. **Desktop**, Settings → *Connect a phone*: a toggle enables **LAN access** (the
   daemon rebinds to `0.0.0.0`; **off by default**). The panel then renders a **QR
   code** encoding the pairing payload.
2. **Pairing payload**: a deep link `2brn://pair?u=<base64url(http://LAN_IP:7842)>&t=<token>`
   (the `token` is the existing `~/.2brn/api_token`). Base64url avoids query-escaping
   issues. The desktop gets the LAN URL(s) from the new `GET /connection-info`.
3. **Mobile**, Pair screen: scan the QR (or type URL + token manually) → validate by
   calling public `GET /status`, then an authed call to confirm the token → store
   `{baseUrl, token}` in **expo-secure-store** → enter the app.
4. **Reconnect/health**: a lightweight `/status` poll drives a global "connected /
   unreachable" banner; unreachable shows a calm offline state, not errors.

**Security posture (v1):** transport is plain HTTP over the LAN. The real gate is the
per-machine bearer token (already enforced on every non-public endpoint). LAN binding
is opt-in/off-by-default, so default behavior is unchanged. Documented future
hardening: self-signed TLS with cert pinning, or a self-hostable relay / Tailscale for
off-LAN access (see [`DECISIONS.md`](./DECISIONS.md)). The token is stored only in the
Android Keystore-backed secure store and is sent only to the paired base URL.

### 4.3 Streaming chat transport

The desktop reads `res.body.getReader()` and parses `data: {"chunk": "..."}` lines.
RN's global `fetch` lacks a streaming body, so chat uses **`expo/fetch`**, which
exposes a real `ReadableStream`. `chatStream.ts` reuses the exact line-parsing logic
and `yield`s chunks. If streaming is unavailable at runtime it falls back to a
buffered read (await the whole response, then emit once) so chat always works.

## 5. Daemon bridge — additive, opt-in changes (separate branch)

All on a new branch off `improvements` (e.g. `feat/mobile-bridge`), **committed
locally only — never pushed**. Off by default; zero behavior change unless enabled.
Each item ships with tests, keeping the daemon's `ruff` / `pyright` / `pytest` green
and the 60% coverage floor.

1. **Config** (`config.py`): add `lan_access: bool = False` to the persisted config
   and its load/save/merge paths.
2. **Bind** (`main.py` `__main__`): if `lan_access`, bind `0.0.0.0`, else keep
   `127.0.0.1`. Read once at startup; document that toggling needs a daemon restart.
3. **`GET /connection-info`** (token-gated): enumerate non-loopback IPv4 interfaces →
   `{ port, lan_access, lan_urls: ["http://192.168.x.y:7842", …] }`. Powers the
   desktop QR.
4. **`/settings`** (GET/PUT): surface and accept `lan_access`.
5. **`POST /ingest/note`** (token-gated): body `{ text, title?, source_url?, tags? }`
   → embed into ChromaDB `note_memories` via the existing `EmbeddingService` (same
   path Joplin notes use) **and** insert a row into a new additive `shared_notes`
   table so saved items survive a Chroma rebuild and can be listed. Returns
   `{ ok, id }`. Degrades gracefully if embeddings are offline (row saved,
   `embedded=false`, healed later).
6. **`GET /ingest/notes`** (token-gated): list recent `shared_notes` for the mobile
   "Saved" screen.
7. **Desktop UI** (`ui/`): a *Connect a phone* panel in Settings — LAN toggle + QR
   (via a small `qrcode` dependency) + copyable URL/token, shown only when LAN access
   is on.

CORS is unchanged: native RN clients don't send a browser `Origin` and aren't subject
to CORS; the bearer token is the gate.

## 6. Feature scope

**In v1 (the "fully working" target):** Pairing, Home/status, Chat (streaming),
Journal (read + regenerate), Blog (read), Insights (day/week/month), Timeline
(read-only), Instructions (CRUD), Saved items, Settings (connection mgmt, pause
toggle, read-only provider info), Share-to-2brn ingest, dark/light theming,
loading/empty/error/offline states, app icon + splash.

**Deferred (documented, not built in v1):**

- **Plugins** management UI — config-heavy, low mobile value; maybe a read-only list
  later.
- **Editing AI provider settings / API keys on mobile** — keep secrets on the
  desktop; mobile shows provider info read-only. (Security default.)
- **Off-LAN access** (relay/Tailscale/TLS) — v1 is home-WiFi + bearer token.
- **Screenshot viewing** — screenshots live encrypted on the desktop; not surfaced on
  mobile in v1.
- **iOS** — Android-only for now; the stack keeps iOS reachable.

## 7. Quality, testing & build

- **Type safety:** TypeScript strict; `tsc --noEmit` clean.
- **Lint:** ESLint (expo) + Prettier clean.
- **Tests (jest-expo + Testing Library):** API client (auth header, error mapping),
  `chatStream` parsing, pairing payload parse/validate, connection context, key hooks,
  and smoke tests for the main screens with a mocked API.
- **Dev harness:** a `MOCK` mode (env flag) backs the app with fixture data so every
  screen can be exercised with no daemon/device — used by tests and for manual review.
- **CI:** GitHub Actions — typecheck + lint + test on push/PR (no deploy).
- **Build (Android):** this machine has Java 21 but no Android SDK, and EAS needs an
  account. v1 ships a complete, tested codebase plus exact build instructions:
  `npx expo prebuild -p android` then `./gradlew assembleRelease` (with Android SDK),
  or `eas build -p android --profile preview` (cloud). See `docs/BUILD.md`.

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| RN streaming fetch quirks | `expo/fetch` + buffered fallback; covered by a parser unit test. |
| `expo-share-intent` needs native build (no Expo Go) | Use a dev-client/prebuild build; document it; share screen still testable via deep-link/mock. |
| No Android SDK here → can't emit an APK autonomously | Deliver tested codebase + `MOCK` harness + precise build docs (agreed definition of done). |
| Plain-HTTP LAN transport | Opt-in/off-by-default + bearer token; future TLS/relay documented. |
| Node 24 vs Expo tooling | Pin Node 22 LTS via `.nvmrc`/`engines`. |
| Corporate TLS / nvm shims in tool shell | Use absolute node path; npm registry already verified reachable. |

## 9. Non-goals

Not rebuilding the capture/OCR/inference pipeline on mobile. Not replacing the
desktop. Not a cloud service. Not multi-user. Not editing secrets on the phone.
