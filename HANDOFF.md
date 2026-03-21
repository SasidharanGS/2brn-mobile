# 2brn Mobile — Handoff

> Read this first. It orients you (human or agent) on **what exists, where it lives,
> what branch it's on, what's verified, and what's left**. Deep detail is in
> [`docs/DESIGN.md`](docs/DESIGN.md), [`docs/ROADMAP.md`](docs/ROADMAP.md),
> [`docs/DECISIONS.md`](docs/DECISIONS.md), [`docs/BUILD.md`](docs/BUILD.md),
> [`docs/PAIRING.md`](docs/PAIRING.md), and
> [`docs/PARITY.md`](docs/PARITY.md) (desktop↔mobile feature parity + full-functionality strategy).

## TL;DR

A React Native (Expo) **Android companion** to the local-first **2brn** desktop app.
The desktop keeps doing screen-capture → OCR → AI inference → RAG; the phone is a
**secure LAN client** to the desktop daemon (chat, journal, blog, insights, timeline)
**plus** one mobile capture source: an Android **share-sheet "Save to 2brn"**.

v1 is **feature-complete and verified** (typecheck, lint, tests, full Metro bundle all
green). The only thing not produced here is the installable APK — this machine had no
Android SDK (see [Build](#build-an-apk)).

---

## ⚠️ Branch & location map (read carefully — two repos side by side)

The mobile app is still **local-only**; the daemon support has since been **merged to
`main` and pushed**. To continue this work you need **both** of these:

| Piece | Repo / path | Branch | Pushed? |
|---|---|---|---|
| **Mobile app** (this repo) | `2brn/2brn_mobile/` (its own git repo) | **`master`** | ❌ no remote configured |
| **Daemon support** (LAN access, ingest, pairing) | `2brn/2brn_desktop/` (the desktop repo) | merged into **`main`** | ✅ on `origin/main` |
| Desktop app baseline | `2brn/2brn_desktop/` | **`main`** (GitHub: `SasidharanGS/2brn`) | ✅ |

- `2brn/` is **not** a git repo — it's a wrapper folder holding `2brn_desktop/` and
  `2brn_mobile/` side by side.
- The mobile app talks to the daemon over HTTP; the daemon changes that let a phone reach
  it (LAN access, ingest, pairing) are now on `main`.
- **Hard rule from the owner: do NOT `git push` or open PRs.** Commit locally; the owner
  pushes/reviews manually. (The owner has already pushed the desktop side; the mobile repo
  still has no remote.)

### Commits on each branch
```
2brn_mobile @ master
  test(mobile): mock-client suite; docs: build + pairing guides, eas.json
  feat(mobile): blog, timeline, instructions, saved, settings, and share-to-2brn
  feat(mobile): navigation, theme, shared components, and core screens
  feat(mobile): connection layer — API client, SSE chat, pairing, secure storage
  chore: scaffold Expo (SDK 56) app + tooling
  docs: mobile companion design, roadmap, and decision log

2brn_desktop @ main   (feat/mobile-bridge merged in; pushed to origin/main)
  feat(daemon): terminal pairing helper for the mobile companion
  feat(daemon): opt-in LAN access + mobile ingest bridge
```

---

## Status (verified 2026-06-08)

| Check | Mobile (`2brn_mobile`) | Daemon (`2brn_desktop` @ main) |
|---|---|---|
| Types | `tsc --noEmit` ✅ | `pyright` ✅ 0 errors / 0 warnings |
| Lint | `eslint` ✅ | `ruff` ✅ |
| Tests | `jest` ✅ 30/30 (5 suites) | `pytest` ✅ 331 passed / 1 skipped |
| Bundle | `expo export --platform web` ✅ (all screens) | — |

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
npm test            # jest (30 tests)
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

- **Pairing:** desktop enables `lan_access` + restart → run `python -m brn_daemon.pair`
  (prints URL + token, and a QR if `qrcode` is installed) → app scans it. Details in
  [`docs/PAIRING.md`](docs/PAIRING.md) and `2brn/docs/mobile-bridge.md`.
- **Streaming chat** uses `expo/fetch` (RN's global `fetch` can't stream); parser is
  `src/api/sse.ts` (unit-tested).
- **Mock mode** (`EXPO_PUBLIC_MOCK=1`) swaps in `src/api/mock.ts` so every screen works
  with no daemon — also what the web preview uses.

### Code map (`2brn_mobile`)
```
app/                       expo-router routes
  _layout.tsx              providers + ShareIntent gate
  pair.tsx                 QR scan / manual pairing
  (tabs)/                  index(Home) · chat · journal · insights · more
  more/                    blog · timeline · instructions · saved · settings
  share.tsx                "Save to 2brn" compose/confirm
src/
  api/        client.ts · sse.ts · mock.ts · types.ts · queryKeys.ts · queryClient.ts
  connection/ ConnectionContext.tsx · pairing.ts
  components/ Screen · ui · states · DateBar · SegmentedControl · Markdown · MarkdownDocView · Header
  hooks/      queries.ts (TanStack Query wrappers)
  theme/      colors.ts (category/state chips, ported from desktop)
  utils/      date.ts (local-day + UTC-aware time helpers)
```

---

## What's done vs. left

**Done & verified:** pairing (QR + manual), Home, Chat (streaming), Journal, Blog,
Insights (day/week/month), Timeline, Instructions (CRUD), Saved, Settings, Share-to-2brn;
dark/light theming; offline/empty/error states; daemon bridge + tests; CI workflow.

**Owner / next-agent follow-ups (none block the app from working):**
1. **Produce the APK** — no Android SDK on the build machine. Use `expo prebuild` + Gradle,
   or `eas build -p android --profile preview` (needs an Expo login). See
   [`docs/BUILD.md`](docs/BUILD.md). `eas.json` is already set up.
2. **Push/share the mobile repo** (`2brn_mobile@master` — still no remote) — owner does this
   manually. Decide monorepo vs. a separate GitHub repo for the mobile app. (The desktop side
   is already merged to `main` and pushed.)
3. **Desktop "Connect a phone" QR panel** — optional; the terminal helper + manual entry
   already work. Would add a QR (e.g. `qrcode.react`) to the desktop UI Settings.
4. **Component render tests** — deferred: `@testing-library/react-native` v14.0.0 `render()`
   returns `{}` on this React 19.2 / RN 0.85 / jest-expo stack (v13 peers are incompatible).
   Logic is unit-tested and `expo export` proves rendering. Revisit when RTL stabilizes, or
   try `test-renderer` directly.
5. **Launcher icon** — Expo's default is used; drop `assets/icon.png` + set `expo.icon`.
6. Possible later: off-LAN access (TLS/relay/Tailscale), plugins UI, iOS.

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
- **Never push / never open PRs.** Local commits only.
- Local-first, additive-only, graceful degradation — don't break the desktop or its data.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`…), often scoped.
