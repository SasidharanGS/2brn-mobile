# 2brn Mobile — Open-Source Scaffolding Design

**Date:** 2026-06-11

## Goal

Add the standard open-source community scaffolding to `2brn_mobile` that matches what `2brn_desktop` already has, adapted to the mobile stack and threat model.

---

## What gets created (9 files)

### Root-level community files

| File | Notes |
|---|---|
| `CONTRIBUTING.md` | npm toolchain, Node 22, `typecheck → lint → test → expo export`, Conventional Commits, PR flow, design principles |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 2.1 — identical to desktop (same maintainer) |
| `SECURITY.md` | Mobile threat model: on-device SQLite + ExecuTorch models, Android Keystore, LAN pairing token/QR |
| `.editorconfig` | utf-8, LF, 2-space indent, 120-col trim — identical to desktop |

### `.github/` additions

| File | Notes |
|---|---|
| `.github/PULL_REQUEST_TEMPLATE.md` | Checklist: `typecheck → lint → test → expo export --platform android`; local-first principle checkbox |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Mobile component dropdown: On-device brain · Capture · Search & memory · Desktop companion/pairing · UI/screens · Other |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Same structure as desktop; principles updated to on-device/local-first language |
| `.github/ISSUE_TEMPLATE/config.yml` | No blank issues; private security reporting → `2brn-mobile` advisory link |
| `.github/dependabot.yml` | npm at `/` + GitHub Actions — weekly, minor/patch grouped |

### What is NOT created

- `IMPROVEMENTS.md` — personal/handoff doc; `HANDOFF.md` already covers it
- `LICENSE` — already exists (MIT)
- `.github/workflows/ci.yml` — already exists and passing

---

## Key tailoring decisions

- **CONTRIBUTING.md** documents npm-only toolchain (no uv, no pnpm); includes `EXPO_PUBLIC_MOCK=1 npm run web` dev tip and Node 22 / nvm prereq.
- **SECURITY.md** scopes to: on-device data at rest (`expo-sqlite` + ExecuTorch model files in app storage), Android Keystore token (via `expo-secure-store`), LAN pairing token + QR code. No screen-capture or loopback API language.
- **Bug report** component dropdown: On-device brain (OCR/STT/LLM) · Capture (notes/share/images/voice) · Search & memory · Desktop companion / pairing · UI / screens · Other / not sure.
- **dependabot.yml** targets `/` for npm (single root `package.json`) and `github-actions` only — no uv or pnpm.

---

## Commit strategy

Each file (or logical group) gets its own commit with a `chore(docs):` or `chore(ci):` scope so every addition appears individually in the contribution graph.
