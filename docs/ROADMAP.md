# 2brn Mobile — Roadmap & Progress

> The "where are we?" file. Each phase has a clear exit criterion. Checkboxes reflect
> work that has actually landed (verified, committed locally — never pushed). See
> [`DESIGN.md`](./DESIGN.md) for the design and [`DECISIONS.md`](./DECISIONS.md) for
> the rationale behind autonomous choices.

**Legend:** ⬜ not started · 🟦 in progress · ✅ done

---

## Phase 0 — Foundation & tooling  ✅
- [x] Design docs (`DESIGN.md`, `ROADMAP.md`, `DECISIONS.md`)
- [x] `git init` the `2brn_mobile` repo (local only)
- [x] Expo (SDK 56) + TypeScript scaffold (expo-router, NativeWind, TanStack Query)
- [x] ESLint + Prettier + `tsc` config; `.nvmrc` (Node 22)
- [x] jest-expo test runner; passing smoke test
- [x] GitHub Actions CI (typecheck + lint + test)
- [x] Repo `README.md`, `LICENSE` (MIT), `.gitignore`

## Phase 1 — Connection layer + daemon bridge  ✅
- [x] Daemon branch `feat/mobile-bridge` off `improvements`
- [x] Daemon: `lan_access` config + `0.0.0.0` bind + `GET /connection-info` + tests
- [x] Daemon: `POST /ingest/note` + `GET/DELETE /ingest/notes` + `shared_notes` table + tests
- [x] Daemon: surface `lan_access` in `/settings`; full suite 331✓/1 skip, pyright 0
- [x] Daemon: terminal pairing helper (`python -m brn_daemon.pair`, optional QR)
- [~] Desktop UI "Connect a phone" QR panel — **deferred** (terminal helper + manual
  entry cover pairing; the React panel is a small optional follow-up)
- [x] Mobile: `api/types.ts`, `api/client.ts`, `api/sse.ts`, `api/mock.ts`, `queryClient`
- [x] Mobile: `ConnectionContext` + secure-store persistence + `useApi`/`useConnection`
- [x] Mobile: Pair screen (QR scan + manual entry); pairing parse/validate + tests

## Phase 2 — Read features  ✅
- [x] Home: status + today snapshot + quick actions
- [x] Insights: day/week/month (categories, states, top apps, comparison, recurring)
- [x] Journal: read + generate + edit (shared `MarkdownDocView`)
- [x] Blog: read + generate + edit
- [x] Shared components: Screen, Card, Button, Chip, Stat, states, DateBar,
  SegmentedControl, Markdown, Header; pull-to-refresh; markdown rendering

## Phase 3 — Chat (streaming RAG)  ✅
- [x] `api/sse.ts` parser (+ tests) and `chatStream` via `expo/fetch` (+ buffered fallback)
- [x] Chat screen: composer, streaming bubbles, scope/category filters, cancel, errors

## Phase 4 — Secondary read/CRUD  ✅
- [x] Timeline: read-only activities for a day with category/state chips
- [x] Instructions: list + create + edit + enable/disable + delete (confirmed)

## Phase 5 — Capture source (Share-to-2brn)  ✅
- [x] `ShareIntentProvider` + redirect gate; `share.tsx` compose/confirm
- [x] Ingest → `POST /ingest/note`; success/error UX
- [x] Saved screen (`GET /ingest/notes`) with delete + open source URL

## Phase 6 — Polish  ✅
- [x] Dark/light theming (NativeWind `dark:`), tokens mirrored from desktop
- [x] Settings: disconnect/re-pair, pause toggle, read-only provider info, about
- [x] Global offline/error/empty/loading states; accessibility labels
- [~] App launcher icon + haptics — **deferred** (Expo default icon used; documented
  in `BUILD.md` how to add `assets/icon.png`)

## Phase 7 — Verification & handoff  ✅
- [x] `tsc --noEmit` clean
- [x] ESLint clean
- [x] `jest` suite green (30 logic tests across 5 suites)
- [x] `expo export --platform web` bundles every screen/route (render + Metro proof)
- [x] `docs/BUILD.md` (+ `eas.json`) and `docs/PAIRING.md`
- [x] `DECISIONS.md` complete
- [~] Component **render** tests — **deferred**: RTL v14.0.0 `render()` returns `{}`
  on this React 19.2 / RN 0.85 / jest-expo stack, and v13 has incompatible peers.
  Logic is unit-tested; rendering is covered by the web export. (See `DECISIONS.md`.)

---

### Current status
**v1 is feature-complete and verified.** All screens build and bundle; the daemon
bridge is implemented and tested. Owner-only follow-ups: produce the APK (needs the
Android SDK or an Expo/EAS login — see `BUILD.md`), optionally add the desktop QR panel
and a launcher icon, and revisit component render tests when RTL stabilizes on RN 0.85.
Nothing has been pushed to any remote.
