# 2brn Mobile — Android companion

> **Continuing this work / picking it up?** Start with [`HANDOFF.md`](HANDOFF.md) — it has
> the branch map (two repos!), current status, quickstart, and what's left.

A React Native (Expo) **Android companion** for [2brn](https://github.com/SasidharanGS/2brn),
the local-first "second brain" desktop app. Your desktop keeps doing the heavy
lifting — screen capture → OCR → AI inference → RAG. This app puts the result in
your pocket:

- 💬 **Chat** with your second brain (streaming RAG) on the go
- 📓 Read your auto-generated **journal** and **blog**
- 📊 Glance at **insights** (day / week / month)
- 🕑 Browse the **timeline** of what you did
- 📥 **Save to 2brn** — share a web page, text, or a note from any app straight
  into your second brain (it becomes searchable in chat)

> **Why not capture on the phone?** Android forbids always-on background screen
> recording (Play policy + battery/OS limits), so the capture engine stays on the
> desktop. The phone is a secure remote client plus a lightweight capture *source*.
> See [`docs/DESIGN.md`](docs/DESIGN.md).

## How it connects

The desktop daemon is loopback-only and bearer-token-authed. To pair, you enable an
**opt-in LAN mode** on the desktop and scan a **QR code**; the phone stores the URL +
token in the Android Keystore and talks to the daemon over your home Wi-Fi. Nothing
leaves your network. See the daemon's [`docs/mobile-bridge.md`](https://github.com/SasidharanGS/2brn/blob/main/docs/mobile-bridge.md)
and [`docs/PAIRING.md`](docs/PAIRING.md).

## Quick start (development)

Prerequisites: **Node 22 LTS**, and (for a device/emulator build) the **Android SDK**
or an [Expo](https://expo.dev) account for EAS.

```bash
npm install

# Type-check, lint, test — no device needed
npm run typecheck
npm run lint
npm test

# Run the app against MOCK data (no daemon, no device) in a browser:
npm run web         # then open the printed URL

# Run on an Android device/emulator (needs Android SDK):
npm run android
```

### Mock mode (review without a daemon or phone)

Set `EXPO_PUBLIC_MOCK=1` (or use the in-app dev toggle) to back every screen with
realistic fixture data. This is how the test suite and `npm run web` exercise the UI
without a paired daemon.

```bash
EXPO_PUBLIC_MOCK=1 npm run web
```

## Building an APK

This repo ships fully type-checked and tested. To produce an installable APK, see
[`docs/BUILD.md`](docs/BUILD.md) — either a local `expo prebuild` + Gradle build
(needs the Android SDK) or a cloud `eas build -p android` (needs an Expo login).

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React Native + Expo (SDK 56) |
| Routing | expo-router (file-based) |
| Server state | TanStack Query |
| Styling | NativeWind (Tailwind for RN) |
| Secure storage | expo-secure-store (Android Keystore) |
| QR scan | expo-camera |
| Share target | expo-share-intent |
| Streaming | `expo/fetch` |
| Tests | jest-expo + @testing-library/react-native |

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) — architecture & design
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased progress
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decision log
- [`docs/PAIRING.md`](docs/PAIRING.md) — connecting the phone to the daemon
- [`docs/BUILD.md`](docs/BUILD.md) — producing an APK

## License

[MIT](LICENSE) © 2026 SasidharanGS
