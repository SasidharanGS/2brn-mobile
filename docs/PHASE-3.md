# Phase 3 — On-device-first + desktop companion

> Make the phone a complete product on its own (the decided architecture: **fully on-device, desktop is
> an optional companion**), then add the optional two-way desktop sync and polish. See
> [`PARITY.md` Part 6](./PARITY.md#part-6--decided-architecture).
>
> _Created 2026-06-10. Target device: OnePlus 15 (also runs on the `Pixel_8` emulator)._

## Goal (one sentence)

**An unpaired phone is a first-class 2brn** — you land in the on-device experience, not a pairing wall —
and pairing a desktop is an opt-in that layers on LAN sync.

## Branch plan

| Order | Branch | Goal | State |
|---|---|---|---|
| **A** | **`feat/on-device-first-home`** | Open the app **unpaired**: land on the on-device home, pairing opt-in. | ✅ built + verified on emulator |
| B _(deferred)_ | `feat/desktop-sync` | Two-way LAN memory sync (pull desktop activities; push phone captures via `POST /ingest/note`); dedupe. | needs a running desktop to verify |
| C _(later)_ | polish | on-device daily mobile-journal; offline/empty states; OEM battery-exemption onboarding. | later |

### Branch A — `feat/on-device-first-home` ✅

Previously, an unpaired phone was **redirected to a "Connect a device" wall**, and the entire on-device
brain (capture / search / ask, built in Phases 0–2) was only reachable via a small link on that screen —
the opposite of "on-device-first". This branch flips it:

**Pieces**
- `app/(tabs)/_layout.tsx` — unpaired now `Redirect`s to **`/memories`** (the on-device home), not `/pair`.
- `app/memories.tsx` — header reworked into a proper home: a back chevron only when there's somewhere to
  go back to, and an opt-in **"🖥 Connect"** action (top-right) → `/pair`.
- `app/pair.tsx` — the escape link is now **"Skip — use 2brn on this phone"** → returns to the home.
- `app/more/settings.tsx` — after **Disconnect**, returns to `/memories` (not `/pair`).

The paired experience is unchanged: a successful pair still `replace`s to the tabbed companion UI, and the
tabs remain desktop-only (they call `useApi()`, which requires a connection).

**Check (definition of done)**
- ✅ typecheck / lint / test green (60 tests).
- ✅ Verified end-to-end on the emulator (unpaired): launch → **"On this phone"** home → **Connect** →
  "Connect a device" (pair) → **Skip** → back to the home. No pairing wall.

### Branch B — `feat/desktop-sync` (deferred — needs a desktop)

Pull the desktop's activities and push phone captures over the LAN (the existing best-effort
`client.ingestNote` from Phase 0 already pushes notes when paired; this would make it two-way + add
dedupe). **Deferred:** meaningful verification needs a running desktop daemon to pair against, so this is
best done when a desktop is available (and alongside the OnePlus 15 device session). The on-device app is
fully functional without it.

## Out of scope for Phase 3

- ❌ Re-opening the deferred Phase 1 C/D (notifications, app-usage) — still native + Play-policy gated.
- ❌ Anything requiring on-device LLM/OCR/STT *inference* verification — that still needs the OnePlus 15
  (Apple-Silicon emulator SVE caveat; see [`PHASE-1.md`](./PHASE-1.md)).
