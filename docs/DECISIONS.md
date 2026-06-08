# 2brn Mobile — Decision Log

Running log of autonomous decisions (newest at the bottom of each section). Each is a
best-practice/conservative default chosen to serve the goal: a polished, working
Android companion that reuses the existing 2brn API and respects its local-first,
additive-only, never-push guardrails.

## Up-front decisions (confirmed with the owner)

- **Product strategy:** Hybrid — companion to the desktop daemon + one mobile-native
  capture source (Android Share-sheet "Save to 2brn"). *Rationale:* the desktop's
  always-on screen-capture engine can't run on Android (Play policy + battery), so the
  value on mobile is access + lightweight capture.
- **Stack:** React Native + Expo. *Rationale:* reuse the maintainer's React/TS skills
  and the existing typed API contract; native UX; iOS reachable later.
- **Connectivity:** additive, opt-in LAN binding + QR pairing on the existing daemon,
  on its own branch, off by default, tested, never pushed.
- **Definition of done:** complete, type-checked, lint-clean, unit-tested codebase +
  mock dev harness + precise APK build docs (no external accounts; final device build
  is owner-run, since this machine has no Android SDK and EAS needs a login).

## Implementation decisions (autonomous)

- **Repo placement & VCS:** `2brn_mobile/` is a sibling of `2brn/` under the non-git
  `2brn_new/` wrapper, initialized as its **own** local git repo. *Rationale:* clean
  separation from the desktop repo; the owner can later choose monorepo vs. separate
  GitHub repo. No remote is configured and nothing is pushed.
- **Routing:** expo-router (file-based) over bare React Navigation. *Rationale:* the
  modern Expo default; gives deep-linking for pairing (`2brn://pair`) and the share
  intent for free.
- **Styling:** NativeWind v4 (Tailwind for RN). *Rationale:* reuses the desktop's
  Tailwind idiom and design tokens; least context-switching for a solo maintainer.
- **Server state:** TanStack Query (same as desktop) with light offline persistence
  for last-synced journal/blog/insights.
- **Android applicationId:** `com.twobrn.mobile` (package segments can't start with a
  digit, so "2brn" → "twobrn"); display name stays "2brn".
- **Node version:** pin Node 22 LTS via `.nvmrc`/`engines` (machine also has Node 24,
  but Expo tooling is happiest on the active LTS).
- **Streaming chat:** use `expo/fetch` (WHATWG streaming) with a buffered fallback,
  because RN's global `fetch` has no streaming body. Parser logic ported verbatim from
  the desktop client and unit-tested.
- **Pairing payload:** deep link `2brn://pair?u=<base64url(url)>&t=<token>`; token kept
  only in expo-secure-store (Android Keystore). Plain-HTTP-over-LAN in v1; the bearer
  token is the gate; TLS/relay documented as future work.
- **Capture ingestion shape:** shared content is both embedded into ChromaDB
  `note_memories` (so it's chat-searchable, like Joplin notes) **and** persisted to a
  new additive `shared_notes` SQLite table (so saved items survive a Chroma rebuild and
  can be listed/deleted from the phone).
- **Provider secrets on mobile:** view-only. Editing AI provider keys stays on the
  desktop. *Rationale:* keep secrets where they already live; smaller mobile attack
  surface.
- **Desktop "Connect a phone" QR panel:** implemented as an additive Settings panel
  when feasible; a daemon `GET /connection-info` plus a tiny terminal QR helper and
  manual URL+token entry guarantee pairing works regardless.

## Deferrals (documented, not built in v1)

- Plugins management UI (config-heavy, low mobile value).
- Editing provider settings / API keys on mobile.
- Off-LAN access (relay / Tailscale / TLS + cert pinning).
- Viewing encrypted screenshots on mobile.
- iOS target.

## Open follow-ups for the owner

- Produce the APK: install the Android SDK and `expo prebuild` + `gradlew`, or run
  `eas build -p android` (needs an Expo login). See `docs/BUILD.md`.
- Decide monorepo vs. separate GitHub repo for `2brn_mobile`, then push manually.
- Review the daemon `feat/mobile-bridge` branch before merging to `main`.
