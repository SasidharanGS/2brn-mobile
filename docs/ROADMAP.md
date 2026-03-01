# 2brn Mobile — Roadmap & Progress

> The "where are we?" file. Each phase has a clear exit criterion. Checkboxes are
> updated **as work actually lands** (verified, committed locally). Commits are
> local-only (never pushed). See [`DESIGN.md`](./DESIGN.md) for the full design.

**Legend:** ⬜ not started · 🟦 in progress · ✅ done

---

## Phase 0 — Foundation & tooling  ✅
Exit: app scaffolds, type-checks, lints, and an empty test passes; docs + CI in place.
- [x] Design docs (`DESIGN.md`, `ROADMAP.md`, `DECISIONS.md`)
- [x] `git init` the `2brn_mobile` repo (local only)
- [x] Expo (SDK 56) + TypeScript scaffold (expo-router, NativeWind, TanStack Query)
- [x] ESLint + Prettier + `tsc` config; `.nvmrc` (Node 22)
- [x] jest-expo test runner; one passing smoke test (date utils)
- [x] GitHub Actions CI (typecheck + lint + test)
- [x] Repo `README.md`, `LICENSE` (MIT), `.gitignore`

> Scaffold note: `create-expo-app`'s bootstrap/template fetch is blocked on this
> network, so the project was assembled via `npm install expo` + `npx expo install`
> (same coherent SDK 56 dependency set). TypeScript installed is 6.0.3, so test
> files import globals from `@jest/globals` rather than relying on ambient types.

## Phase 1 — Connection layer + daemon bridge  🟦
Exit: phone can pair with the daemon and make an authed call; daemon changes tested & green.
- [x] Daemon branch `feat/mobile-bridge` off `improvements`
- [x] Daemon: `lan_access` config + `0.0.0.0` bind + `GET /connection-info` + tests
- [x] Daemon: `POST /ingest/note` + `GET /ingest/notes` + `shared_notes` table + tests
- [x] Daemon: surface `lan_access` in `/settings` + tests (full suite 330✓/1 skip; pyright 0)
- [ ] Desktop UI: "Connect a phone" panel (LAN toggle + QR) *(or terminal QR helper + manual entry)*
- [x] Mobile: `api/types.ts` (ported + ingest types)
- [ ] Mobile: `api/client.ts` (bearer fetch) + `chatStream.ts`
- [ ] Mobile: `ConnectionContext` + secure-store persistence
- [ ] Mobile: Pair screen (QR scan + manual entry) + payload parse/validate + tests

## Phase 2 — Read features  ⬜
Exit: Home, Insights, Journal, Blog render real (and mock) data with proper states.
- [ ] Home/Dashboard: status + today's insights summary + quick actions
- [ ] Insights: day/week/month (categories, states, top apps, heatmap, comparison, recurring)
- [ ] Journal: date-scoped read + regenerate + edit
- [ ] Blog: date-scoped read + regenerate + edit
- [ ] Shared DateBar, Card, Stat, Empty/Error/Offline/Loading components
- [ ] Pull-to-refresh; markdown rendering

## Phase 3 — Chat (streaming RAG)  ⬜
Exit: ask a question, see a streamed grounded answer; cancel works; offline handled.
- [ ] `chatStream.ts` (expo/fetch streaming + buffered fallback) + parser tests
- [ ] Chat screen: composer, streaming bubbles, date/category filter, cancel, errors

## Phase 4 — Secondary read/CRUD  ⬜
Exit: Timeline and Instructions usable.
- [ ] Timeline: captures/activities for a date (read-only), category/state chips
- [ ] Instructions: list + create + edit + enable/disable + delete (with confirm)

## Phase 5 — Capture source (Share-to-2brn)  ⬜
Exit: sharing text/URL into 2brn ingests it; it appears under Saved and is chat-searchable.
- [ ] `expo-share-intent` config + `share.tsx` landing/confirm
- [ ] Ingest call → `POST /ingest/note`; success/failure UX
- [ ] Saved screen (`GET /ingest/notes`) with delete

## Phase 6 — Polish  ⬜
Exit: feels rounded — theming, settings, a11y, icon/splash, consistent states.
- [ ] Dark/light theme + tokens mirrored from desktop `design.ts`
- [ ] Settings: connection mgmt (unpair/re-pair), pause toggle, read-only provider info, about
- [ ] App icon + splash; accessibility labels; haptics where sensible
- [ ] Global offline banner + reconnect

## Phase 7 — Verification & handoff  ⬜
Exit: green typecheck/lint/test; build docs; decision log; final summary.
- [ ] `tsc --noEmit` clean
- [ ] ESLint clean
- [ ] `jest` suite green
- [ ] `docs/BUILD.md` (prebuild + Gradle, and EAS)
- [ ] `DECISIONS.md` complete; final summary to the user

---

### Current status
Design docs written. Next: initialize the repo and scaffold the Expo app (Phase 0).
Nothing has been built or pushed yet. This file is updated only when a step is
verified and committed locally.
