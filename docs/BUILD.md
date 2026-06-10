# Building & running 2brn Mobile (Android)

This project ships fully type-checked, linted, and unit-tested. There are three ways
to run it, from "no Android tooling" to "installable APK".

## 0. Prerequisites

- **Node 22 LTS** (`.nvmrc` pins it) and `npm install` in this folder.
- For a real device/emulator build: **JDK 17** and the **Android SDK** (via Android
  Studio, or `sdkmanager`), with `ANDROID_HOME` set. SDK Platform 35 + build-tools.
- For cloud builds: an **Expo account** and `eas-cli` (`npm i -g eas-cli`).

> The **Share-to-2brn** feature uses a native module (`expo-share-intent`), so it
> needs a **development/prebuild build** — it does **not** run in Expo Go. Everything
> else (chat, journal, insights, pairing) runs in any of the modes below.

## 1. Review without a device (mock data, browser)

No Android tooling needed. Backs every screen with realistic fixtures:

```bash
npm install
EXPO_PUBLIC_MOCK=1 npm run web      # open the printed http://localhost URL
```

## 2. Run on a device / emulator (debug)

Needs the Android SDK and a connected device or running emulator:

```bash
npm install
npm run android                      # = expo run:android (prebuilds + installs a dev build)
```

Then pair with your desktop daemon (see [`PAIRING.md`](./PAIRING.md)).

## 3. Produce an installable APK

### Option A — Local (Android SDK required)

```bash
npx expo prebuild -p android         # generates the android/ project
cd android
./gradlew assembleRelease            # or assembleDebug for an unsigned debug APK
# APK is written to:
#   android/app/build/outputs/apk/release/app-release.apk
```

A release build needs a signing key. For a quick personal/debug APK use
`assembleDebug` (auto-signed with the debug keystore) →
`android/app/build/outputs/apk/debug/app-debug.apk`.

### Option B — EAS cloud build (no local Android SDK)

Uploads the project to Expo's build servers and returns a downloadable APK.
`eas.json` already defines a `preview` (APK) profile:

```bash
npm i -g eas-cli
eas login                            # your Expo account
eas build -p android --profile preview
```

Download the APK from the URL EAS prints (or expo.dev), then `adb install` it or
open it on the phone.

## Release hardening (before publishing)

A debug build is fine for development, but a **published** release needs three things the
default Expo template does not set up. None can be fully verified without an Android device,
so they're owner steps — the app.json permission surface (below) is the only part wired in
the repo today.

### 1. Real signing key (not the debug keystore)

The CNG template signs the `release` variant with the shared **debug** keystore — that
**cannot be published to Play** and gives no key integrity. Generate a real upload key:

```bash
eas credentials            # managed: EAS generates/stores the upload keystore
# — or, for a local Gradle build, create a keystore and a git-ignored
#   android/keystore.properties (storeFile/storePassword/keyAlias/keyPassword).
```

`*.keystore` is already git-ignored — never commit a keystore or its passwords.

### 2. R8 minification + resource shrinking

Release builds are **not** minified today, so the artifact is larger than necessary — which
matters for an app that pulls ~1 GB of models. Because `android/` is git-ignored (CNG),
enable this via the **`expo-build-properties`** config plugin (not `gradle.properties`,
which a prebuild would overwrite):

```bash
npx expo install expo-build-properties
```

```jsonc
// app.json → expo.plugins
[
  "expo-build-properties",
  {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true,
      // react-native-executorch ships NO consumer ProGuard rules and is reached via
      // JNI/reflection, so R8 can strip classes the release build needs. Add keeps for
      // its native package — confirm the exact package from
      //   node_modules/react-native-executorch/android
      // before trusting these, e.g.:
      "extraProguardRules": "-keep class com.swmansion.rnexecutorch.** { *; }"
    }
  }
]
```

> ⚠️ Deliberately **not enabled in the repo by default.** It only affects the release build,
> which can't be verified here (no Android SDK; on-device inference is still pending — see the
> README status). After enabling, **smoke-test a release build on a physical device** and
> adjust the keep rules if anything is stripped.

### 3. Permission surface

Declared in `app.json` (`android.permissions`):

- `CAMERA` — scanning the desktop pairing QR code.
- `RECORD_AUDIO` — on-device voice capture (Whisper STT).

`SYSTEM_ALERT_WINDOW` (screen overlay) is **blocked** (`android.blockedPermissions`): the app
has no overlay feature, so it's only a transitive dev-tool artifact. Confirm it's absent from
the merged release manifest after `expo prebuild`.

**Cleartext traffic is intentionally permitted.** The optional desktop companion is reached
over plain **HTTP on the LAN** (`http://<lan-ip>:7842`), so a blanket cleartext block would
break pairing. Mitigations: LAN access is **opt-in / off by default** and gated by a bearer
token, and the *on-device* features need no network at all. Future hardening (self-signed TLS
+ pinning, or a relay) is tracked in [`DESIGN.md`](./DESIGN.md).

## Verify before building

```bash
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm test                # jest
npx expo export --platform web   # bundles every screen via Metro (smoke test)
```

## Notes

- App id: `com.twobrn.mobile` (Java package segments can't start with a digit, so
  "2brn" → "twobrn"); display name is **2brn**.
- A placeholder launcher icon is set (`assets/icon.png` + `adaptiveIcon`, wired in
  `app.json`). Replace it with a branded `1024×1024` PNG; on a **clean** prebuild the native
  mipmaps regenerate (incremental builds won't — force `expo prebuild -p android --clean`).
- `android/` and `ios/` are git-ignored (regenerated by `expo prebuild`).
