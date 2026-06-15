# 2brn Mobile — an on-device second brain for Android

A React Native (Expo) **on-device, local-first "second brain"** for Android. It captures
notes and runs OCR, speech-to-text, embeddings, semantic search, and a small LLM
**entirely on the phone** — no cloud, no offload. A [2brn](https://github.com/SasidharanGS/2brn)
**desktop** install is an *optional* companion you can pair with over your home Wi‑Fi, but
it is never required.

- 🧠 **Capture** — quick notes, the Android **share sheet** ("Save to 2brn"), images
  (text pulled out with on-device **OCR**), and **voice** notes (on-device transcription)
- 🔎 **Search** — every capture is embedded on-device and ranked by semantic similarity,
  fully offline
- 💬 **Ask** — the on-device LLM answers questions grounded in your own captures (on-device RAG)
- 🏷️ **Auto-enrich** *(opt-in)* — the LLM adds a one-line summary and topic tags to new captures
- 🔗 **Companion** *(optional)* — pair a desktop over the LAN to also browse and sync its
  journal, blog, insights, timeline, and chat
- 🎨 **Two skins** — switch between **modern** and **minimal** (a monochrome, text-first
  look), each in light or dark, from Settings

Everything works with **no desktop and no network**. Nothing leaves the phone by default.

> **Why on-device instead of mirroring the desktop?** Android forbids always-on background
> screen capture (Play policy + battery/OS limits), so the phone can't replicate the
> desktop's capture engine. Rather than be a thin remote control, the phone runs its *own*
> light brain over the signals it can capture, and treats the desktop as an optional
> sibling to sync with. See [`docs/DESIGN.md`](docs/DESIGN.md) and
> [`docs/PARITY.md`](docs/PARITY.md) for the full reasoning.

## Status

On-device **capture, embeddings, semantic search, OCR, voice transcription, and LLM
answers/enrichment** all work today — **verified on a physical device** (OnePlus 15,
Android 16, `arm64-v8a`) on 2026-06-13. The inference runtime can't run on the Apple-Silicon
emulator (it crashes with `SIGILL` because the emulator falsely advertises SVE), so a flagship
Android phone is the target and the definition of done; see
[`docs/PHASE-1.md`](docs/PHASE-1.md) / [`docs/PHASE-2.md`](docs/PHASE-2.md).

## On-device pipeline

```
capture (note · share · image · voice)
   → OCR / speech-to-text            (react-native-executorch)
   → embed                           (all-MiniLM-L6-v2, 384-dim, on-device)
   → store                           (expo-sqlite, on the phone)
   → semantic search                 (cosine similarity in JS)
   → ask → grounded answer           (Llama 3.2 1B, on-device)
```

A single toolkit, [`react-native-executorch`](https://github.com/software-mansion/react-native-executorch),
provides all four models (OCR, STT, embeddings, LLM); the vector memory is `expo-sqlite`
plus JS cosine ranking. **Nothing is sent off-device.**

## Quick start (development)

Prerequisites: **Node 22 LTS** (`.nvmrc`), and for a device/emulator build the **Android
SDK** + **JDK 17** (or an [Expo](https://expo.dev) account for EAS).

```bash
nvm use            # Node 22
npm install

# Type-check, lint, test — no device needed
npm run typecheck
npm run lint
npm test

# See every screen with demo data — no device, no models, in a browser:
EXPO_PUBLIC_MOCK=1 npm run web

# Run on an Android device/emulator (needs the Android SDK + JDK 17):
npm run android
```

> The on-device models and the **Share-to-2brn** target use native modules, so they need a
> **dev/prebuild build** — they do not run in Expo Go. On-device inference must be verified
> on a **physical device** (see Status above).

### Mock mode (review without models or a device)

Set `EXPO_PUBLIC_MOCK=1` (or use the in-app dev toggle) to back every screen with realistic
fixture data. This is how the test suite and `npm run web` exercise the UI without models or
a paired daemon.

## Pairing the optional desktop companion

The desktop daemon is loopback-only by default. To pair, enable an **opt-in LAN mode** on
the desktop and scan a **QR code**; the desktop mints your phone its **own per-device token**
(the master token never leaves the desktop), and the phone stores the URL + token in the
Android Keystore and talks to the daemon over your home Wi‑Fi. You can revoke a phone from the
desktop at any time — the app then self-heals back to its pairing screen. Nothing leaves your
network. See [`docs/PAIRING.md`](docs/PAIRING.md) and the daemon's
[`docs/mobile-bridge.md`](https://github.com/SasidharanGS/2brn/blob/main/docs/mobile-bridge.md).

## Building an APK

This repo ships fully type-checked, linted, and tested. To produce an installable APK, see
[`docs/BUILD.md`](docs/BUILD.md) — either a local `expo prebuild` + Gradle build (needs the
Android SDK) or a cloud `eas build -p android` (needs an Expo login).

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React Native + Expo (SDK 56) |
| Routing | expo-router (file-based) |
| On-device ML | `react-native-executorch` — OCR, speech-to-text, embeddings, LLM |
| Local store | expo-sqlite (memories + vectors) |
| Search | cosine similarity in JS over on-device embeddings |
| Styling | NativeWind (Tailwind for RN) + a two-skin token system (modern · minimal, each light/dark) |
| Server state (companion) | TanStack Query |
| Secure storage | expo-secure-store (Android Keystore) — pairing token |
| Capture | expo-share-intent · expo-image-picker · expo-audio · expo-camera (QR) |
| Streaming (companion chat) | `expo/fetch` |
| Tests | jest-expo (pure-logic unit tests) |

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) — architecture & design (on-device-first)
- [`docs/PARITY.md`](docs/PARITY.md) — desktop ↔ mobile parity + the on-device strategy
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased progress
- [`docs/PHASE-0.md`](docs/PHASE-0.md) … [`docs/PHASE-3.md`](docs/PHASE-3.md) — per-phase plans
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decision log
- [`docs/PAIRING.md`](docs/PAIRING.md) — connecting the optional desktop companion
- [`docs/BUILD.md`](docs/BUILD.md) — producing an APK

## License

[MIT](LICENSE) © 2026 SasidharanGS
