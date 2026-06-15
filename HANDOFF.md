# 2brn Mobile — Handoff

> Read this first. It orients you (human or agent) on **what exists, where it lives,
> what branch it's on, what's verified, and what's left**. Deep detail is in
> [`docs/DESIGN.md`](docs/DESIGN.md), [`docs/ROADMAP.md`](docs/ROADMAP.md),
> [`docs/DECISIONS.md`](docs/DECISIONS.md), [`docs/BUILD.md`](docs/BUILD.md),
> [`docs/PAIRING.md`](docs/PAIRING.md), and
> [`docs/PARITY.md`](docs/PARITY.md) (desktop↔mobile feature parity + full-functionality strategy).

## TL;DR

A React Native (Expo) **on-device, local-first second brain** for Android. The phone runs
its **own** pipeline — capture (note · share · image · voice) → OCR/STT → embeddings →
SQLite → semantic search → grounded LLM answers — all on-device via
**`react-native-executorch`** (Llama 3.2 1B, all-MiniLM-L6-v2). A 2brn **desktop** is an
**optional** companion: pair over the LAN to also view/sync its chat, journal, blog,
insights, and timeline. Nothing is required off-device.

**Status:** the companion layer is complete; the on-device brain is **built through Phase 2**
and **verified on a physical device** — capture, OCR, STT, embeddings, semantic search, and
LLM answers/enrich all run on the OnePlus 15 (Android 16, `arm64-v8a`) on 2026-06-13, with
no `SIGILL` (the crash was emulator-only). A **token-driven two-skin theme system** (modern +
minimal, switchable in Settings) is in place. A signed release build is wired (real upload
keystore + R8/minify — see [Build](#build-an-apk)). Typecheck, lint, tests, and the Metro
bundle are green. Remaining: Phase 3 (two-way memory sync) and component render tests
(deferred — RTL/React 19 issue).

---

## Branch & location map (two repos side by side)

The mobile app and the desktop live in **two separate GitHub repos** (the monorepo-vs-separate
question is **resolved: separate repos**):

| Piece | Repo / path | Branch | Remote |
|---|---|---|---|
| **Mobile app** (this repo) | `2brn/2brn_mobile/` | **`main`** | ✅ `git@github.com:SasidharanGS/2brn-mobile.git` |
| **Desktop app + daemon** (incl. LAN access, ingest, pairing) | `2brn/2brn_desktop/` | **`main`** | ✅ `github.com/SasidharanGS/2brn` |

- `2brn/` is **not** a git repo — it's a wrapper folder holding `2brn_desktop/` and
  `2brn_mobile/` side by side.
- The mobile app talks to the (optional) desktop daemon over HTTP; the daemon-side support
  (LAN access, `/ingest`, pairing) is merged and pushed on the desktop's `main`.
- Going forward, mobile work lands via **PRs into `main`** on the mobile repo. See
  `git log --oneline` for history (the on-device Phases 0–3A merged on top of the companion v1).

---

## Status

| Check | Mobile (`2brn_mobile`) | Daemon (`2brn_desktop` @ main) |
|---|---|---|
| Types | `tsc --noEmit` ✅ | `pyright` ✅ 0 errors / 0 warnings |
| Lint | `eslint` ✅ | `ruff` ✅ |
| Tests | `jest` ✅ (13 suites, pure-logic) | `pytest` ✅ (CI floor 60% coverage) |
| Bundle | `expo export --platform web` ✅ (all screens) | — |
| On-device | OCR · STT · LLM · embeddings ✅ OnePlus 15 (2026-06-13) | — |

The daemon changes are **additive and off by default** — with `lan_access` unset the
daemon behaves exactly as before.

---

## Quickstart for the next agent

```bash
# --- Mobile app ---
cd 2brn/2brn_mobile
nvm use            # Node 22 (see .nvmrc). If `node`/`npx` misbehave in a tool shell,
                   # prepend ~/.nvm/versions/node/v22.*/bin to PATH and `unset -f node npm npx`.
npm install

npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # jest (pure-logic suites)
npx expo export --platform web   # bundles every screen via Metro (render/build smoke test)

# See the whole UI with demo data — no daemon, no device:
EXPO_PUBLIC_MOCK=1 npm run web
```

```bash
# --- Daemon support (other repo; work is on main) ---
cd 2brn/2brn_desktop          # the desktop repo
cd daemon
UV_SYSTEM_CERTS=1 uv run ruff check src/
TZ=UTC UV_SYSTEM_CERTS=1 uv run --extra dev pytest tests/test_mobile_bridge.py -v
```

---

## How it fits together

```
Android app (Expo / RN)                          Desktop daemon (FastAPI :7842)
  expo-router tabs: Home·Chat·Journal·            feat/mobile-bridge adds (opt-in):
    Insights·More(Blog/Timeline/Instructions/       • lan_access → bind 0.0.0.0
    Saved/Settings) + Pair + Share                   • GET /connection-info
  src/api/{client,sse,mock,types}.ts  ───HTTP───►    • POST/GET/DELETE /ingest/note(s)
  src/connection/{ConnectionContext,pairing}.ts      • shared_notes table
  token in Android Keystore (expo-secure-store)      • python -m brn_daemon.pair (QR/manual)
```

- **Pairing:** desktop enables `lan_access` + restart → mint a **per-device token** from the
  desktop's **Connect a device** screen (or `python -m brn_daemon.pair`) → app scans the QR
  (or types URL + token). The master loopback token is never shared; each phone gets its own
  revocable token, and the app **self-heals** (auto-unpairs) on a `401` if that token is
  revoked (`src/connection/ConnectionContext.tsx`). Details in
  [`docs/PAIRING.md`](docs/PAIRING.md) and `2brn/docs/mobile-bridge.md`.
- **Streaming chat** uses `expo/fetch` (RN's global `fetch` can't stream); parser is
  `src/api/sse.ts` (unit-tested).
- **Mock mode** (`EXPO_PUBLIC_MOCK=1`) swaps in `src/api/mock.ts` so every screen works
  with no daemon — also what the web preview uses.

### Code map (`2brn_mobile`)
```
app/                       expo-router routes
  _layout.tsx              providers (Query · Theme · Connection · 4 ML contexts) + ShareIntent gate
  memories.tsx             ON-DEVICE HOME: capture (note/image/voice) · search · ask
  pair.tsx                 QR scan / manual pairing
  share.tsx                "Save to 2brn" compose/confirm
  (tabs)/                  index(Home) · chat · journal · insights · more
  more/                    blog · timeline · instructions · saved · settings
  dev/smoke.tsx            one-tap on-device OCR/STT/LLM/embeddings smoke check
src/
  ml/         model constants (llm·embeddings·ocr·stt) + PURE logic (similarity·search·prompt·
              enrich·ocrText·audioWaveform) + 4 React contexts + save/lazy/auto-enrich hooks
  db/         local.ts — expo-sqlite store (memories + embedding blobs, migrations)
  api/        client.ts · sse.ts · mock.ts · types.ts · queryKeys.ts · queryClient.ts
  connection/ ConnectionContext.tsx (self-heals on 401) · pairing.ts
  hooks/      queries.ts (TanStack Query wrappers) · useMarkdownDoc.ts
  components/ Screen · ui · states · AppText · DateBar · SegmentedControl · Markdown · Header · …
  theme/      tokens.ts (two-skin token system) · ThemeContext.tsx (useTheme) · colors.ts
  settings/   prefs.ts (on-device prefs: skin, theme mode, auto-enrich)
  utils/      date.ts (local-day + UTC-aware time) · url.ts
```

---

## What's done vs. left

**Done & verified (companion layer):** pairing (QR + manual, per-device tokens, revoke
self-heal), Home, Chat (streaming), Journal, Blog, Insights (day/week/month), Timeline,
Instructions (CRUD), Saved, Settings, Share-to-2brn; offline/empty/error states; daemon
bridge + tests; CI.

**Done & verified — on-device brain (Phases 0–2):** local SQLite store + on-device
embeddings + semantic search; image OCR + voice STT capture; on-device LLM answers + opt-in
auto-enrich — **all verified on the OnePlus 15 (2026-06-13)**, no `SIGILL` (that was
emulator-only). A one-tap smoke check lives at `app/dev/smoke.tsx`.

**Done — theming:** a token-driven **two-skin** system (modern + minimal), each with
light/dark, switchable in Settings (`src/theme/tokens.ts` · `ThemeContext.tsx`;
`AppText` themes inline text; persisted in `src/settings/prefs.ts`).

**Done — release build:** real upload keystore (git-ignored `credentials/keystore.properties`)
+ R8/minify + resource shrink wired in `app.json`. See [`docs/BUILD.md`](docs/BUILD.md).

**Owner / next-agent follow-ups:**
1. **Phase 3 — two-way memory sync** with the desktop over the LAN (pull desktop activities;
   push phone captures via `POST /ingest/note`).
2. **Component render tests** — deferred: `@testing-library/react-native` v14 `render()`
   returns `{}` on this React 19 / RN 0.85 / jest-expo stack. Logic is unit-tested and
   `expo export` proves bundling. Revisit when RTL stabilizes.
3. Possible later: off-LAN access (TLS/relay/Tailscale), plugins UI (read-only), iOS.

---

## Gotchas the next agent must know (this environment)

- **Scaffolding:** `create-expo-app` is **blocked on this network** (template/CDN fetch
  hangs). The project was assembled with `npm install expo` + `npx expo install` — keep
  using that if adding native deps.
- **Node/nvm in tool shells:** the nvm lazy-load shims shadow `node`/`npm`/`npx`. Use Node 22
  and either `nvm use` or prepend `~/.nvm/versions/node/v22.*/bin` to `PATH` and
  `unset -f node npm npx pnpm`.
- **Corporate TLS:** npm works (`strict-ssl false` + Netskope CA via `NODE_EXTRA_CA_CERTS`).
  For the daemon's `uv`, prefix commands with `UV_SYSTEM_CERTS=1`; run daemon tests with `TZ=UTC`.
- **TypeScript is 6.0.3** here → test files import globals from `@jest/globals` and use
  standard matchers (don't rely on ambient `@types/jest`).
- **Daemon timestamps** are UTC with the offset stripped; `src/utils/date.ts:prettyTime`
  treats naive timestamps as UTC before converting to local. Keep that when adding time UI.
- **Android applicationId** is `com.twobrn.mobile` (package segments can't start with a
  digit) and the deep-link scheme is `twobrn://` (same reason). Display name is "2brn".

## House rules (from the owner)
- Local-first, additive-only, graceful degradation — don't break the desktop or its data.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`…), often scoped.
