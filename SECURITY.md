# Security Policy

2brn Mobile is a local-first app that stores your captures, embeddings, and on-device
model outputs on your phone. Because of the sensitive nature of that data, we take
security reports seriously.

## Supported versions

This project is pre-1.0 and under active development. Security fixes are applied to
the latest `main` branch. There are no maintained older release lines yet.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Instead, report privately through GitHub's built-in private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**
   (<https://github.com/SasidharanGS/2brn-mobile/security/advisories/new>).
3. Describe the issue, including steps to reproduce and the potential impact.

You should receive an acknowledgement within a few days. We'll work with you to
understand and fix the issue, and we'll credit you in the advisory unless you'd
prefer to remain anonymous.

## Scope and good-faith guidelines

The following are especially relevant to 2brn Mobile's threat model:

- **On-device data at rest** — captures, embeddings, and metadata live in
  `expo-sqlite` under the app's private storage. ExecuTorch model files (OCR, STT,
  embeddings, LLM) are downloaded once and stored in app-scoped storage; they should
  never be world-readable.
- **Bearer token** — the LAN pairing token is stored in the Android Keystore via
  `expo-secure-store` and must never be written to disk, logs, or transmitted over
  unencrypted channels.
- **LAN pairing** — the QR / manual pairing flow exchanges a bearer token with the
  desktop daemon over your home Wi-Fi. Reports about token leakage, replay attacks,
  or man-in-the-middle scenarios on the pairing flow are in scope.
- **Share-sheet handler** — the app registers as an Android share target. Reports
  about unintended data retention or exposure via the share intent are welcome.

When researching, please act in good faith: only test against your own local
installation, don't access or exfiltrate other people's data, and don't run
denial-of-service or destructive tests.

## What is *not* a vulnerability

- Captures staying on-device by design; that is the core feature, not a data leak.
- On-device inference running without a network connection is expected behaviour.
- Sending data to the desktop daemon *you explicitly paired with* over your own LAN
  is expected behaviour.
