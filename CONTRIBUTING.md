# Contributing to 2brn Mobile

Thanks for your interest in improving 2brn Mobile! This is a local-first, on-device
"second brain" for Android — a React Native / Expo app. The notes below get you from a
fresh clone to a green pull request.

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Project layout

```
app/        expo-router routes (tabs, pair, share)
src/        API client, connection context, components, hooks, theme, utils
docs/       Architecture and design docs
```

## Prerequisites

- **Node 22 LTS** — use [nvm](https://github.com/nvm-sh/nvm): `nvm use` (`.nvmrc` is in the repo)
- **Android SDK + JDK 17** (or an [Expo](https://expo.dev) account for EAS cloud builds) — only needed for native device builds

## Getting started

```bash
nvm use          # Node 22
npm install

# Run every check — no device needed
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # jest

# Preview the full UI with demo data (no device, no daemon)
EXPO_PUBLIC_MOCK=1 npm run web
```

## Development workflow

```bash
npm run typecheck    # TypeScript — must be clean
npm run lint         # ESLint — must be clean
npm test             # jest (all suites must pass)
npx expo export --platform android   # bundle smoke-test (no Android SDK needed)
```

CI runs the same four steps on every push and pull request.

## Branches and commits

- Branch off `main`. Use a descriptive prefix: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `ci:`, `perf:`, `test:`.
  Scopes are encouraged, e.g. `feat(capture):`, `fix(pairing):`.

## Pull requests

1. Make sure `typecheck`, `lint`, `test`, and `expo export` all pass locally.
2. Open a PR against `main` and fill in the template.
3. CI must be green before merge.

## Design principles

Every change should respect these constraints:

- **Local-first.** All user data stays on the device. Nothing is sent to third-party
  clouds. On-device models (OCR, STT, embeddings, LLM) run without a network.
- **Graceful degradation.** If the desktop daemon or LAN is unavailable, the app must
  not crash or lose data — capture and on-device features keep working.
- **Additive changes.** Prefer extending behaviour over changing it. Don't break
  existing captures, embeddings, or the pairing flow.
- **No secrets on disk.** The bearer token lives in the Android Keystore via
  `expo-secure-store`, never in a config file.

## Reporting bugs and requesting features

Use the [issue templates](https://github.com/SasidharanGS/2brn-mobile/issues/new/choose).
For security-sensitive issues, follow [SECURITY.md](SECURITY.md) instead of opening a
public issue.
