# Open-Source Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 9 missing open-source community files to `2brn_mobile`, mirroring what `2brn_desktop` already has, adapted to the mobile stack.

**Architecture:** Pure file creation — no code changes, no dependency changes. Each file is standalone. Tasks are independent and can be executed in any order; each gets its own commit.

**Tech Stack:** React Native / Expo, npm, Node 22, GitHub Actions.

---

## File map

| Task | File(s) created |
|---|---|
| 1 | `CONTRIBUTING.md` |
| 2 | `CODE_OF_CONDUCT.md` |
| 3 | `SECURITY.md` |
| 4 | `.editorconfig` |
| 5 | `.github/PULL_REQUEST_TEMPLATE.md` |
| 6 | `.github/ISSUE_TEMPLATE/bug_report.yml` |
| 7 | `.github/ISSUE_TEMPLATE/feature_request.yml` + `config.yml` |
| 8 | `.github/dependabot.yml` |

---

### Task 1: CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Create the file**

`2brn_mobile/CONTRIBUTING.md`:

```markdown
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
```

- [ ] **Step 2: Verify the file renders correctly**

```bash
cat 2brn_mobile/CONTRIBUTING.md | head -5
```
Expected: first line is `# Contributing to 2brn Mobile`

- [ ] **Step 3: Commit**

```bash
cd 2brn_mobile
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md"
```

---

### Task 2: CODE_OF_CONDUCT.md

**Files:**
- Create: `CODE_OF_CONDUCT.md`

- [ ] **Step 1: Create the file**

`2brn_mobile/CODE_OF_CONDUCT.md` — Contributor Covenant 2.1, identical to the desktop version (same maintainer `@SasidharanGS`):

```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, caste, color, religion, or sexual
identity and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards

Examples of behavior that contributes to a positive environment for our
community include:

* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes,
  and learning from the experience
* Focusing on what is best not just for us as individuals, but for the overall
  community

Examples of unacceptable behavior include:

* The use of sexualized language or imagery, and sexual attention or advances of
  any kind
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or email address,
  without their explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

Community leaders have the right and responsibility to remove, edit, or reject
comments, commits, code, wiki edits, issues, and other contributions that are
not aligned to this Code of Conduct, and will communicate reasons for moderation
decisions when appropriate.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.
Examples of representing our community include using an official email address,
posting via an official social media account, or acting as an appointed
representative at an online or offline event.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the project maintainer, [@SasidharanGS](https://github.com/SasidharanGS),
privately through GitHub. All complaints will be reviewed and investigated
promptly and fairly.

All community leaders are obligated to respect the privacy and security of the
reporter of any incident.

## Enforcement Guidelines

Community leaders will follow these Community Impact Guidelines in determining
the consequences for any action they deem in violation of this Code of Conduct:

### 1. Correction

**Community Impact**: Use of inappropriate language or other behavior deemed
unprofessional or unwelcome in the community.

**Consequence**: A private, written warning from community leaders, providing
clarity around the nature of the violation and an explanation of why the
behavior was inappropriate. A public apology may be requested.

### 2. Warning

**Community Impact**: A violation through a single incident or series of
actions.

**Consequence**: A warning with consequences for continued behavior. No
interaction with the people involved, including unsolicited interaction with
those enforcing the Code of Conduct, for a specified period of time. This
includes avoiding interactions in community spaces as well as external channels
like social media. Violating these terms may lead to a temporary or permanent
ban.

### 3. Temporary Ban

**Community Impact**: A serious violation of community standards, including
sustained inappropriate behavior.

**Consequence**: A temporary ban from any sort of interaction or public
communication with the community for a specified period of time. No public or
private interaction with the people involved, including unsolicited interaction
with those enforcing the Code of Conduct, is allowed during this period.
Violating these terms may lead to a permanent ban.

### 4. Permanent Ban

**Community Impact**: Demonstrating a pattern of violation of community
standards, including sustained inappropriate behavior, harassment of an
individual, or aggression toward or disparagement of classes of individuals.

**Consequence**: A permanent ban from any sort of public interaction within the
community.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
<https://www.contributor-covenant.org/version/2/1/code_of_conduct.html>.

Community Impact Guidelines were inspired by
[Mozilla's code of conduct enforcement ladder][mozilla coc].

For answers to common questions about this code of conduct, see the FAQ at
<https://www.contributor-covenant.org/faq>. Translations are available at
<https://www.contributor-covenant.org/translations>.

[homepage]: https://www.contributor-covenant.org
[mozilla coc]: https://github.com/mozilla/diversity
```

- [ ] **Step 2: Commit**

```bash
cd 2brn_mobile
git add CODE_OF_CONDUCT.md
git commit -m "docs: add CODE_OF_CONDUCT.md (Contributor Covenant 2.1)"
```

---

### Task 3: SECURITY.md

**Files:**
- Create: `SECURITY.md`

- [ ] **Step 1: Create the file**

`2brn_mobile/SECURITY.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
cd 2brn_mobile
git add SECURITY.md
git commit -m "docs: add SECURITY.md (mobile threat model)"
```

---

### Task 4: .editorconfig

**Files:**
- Create: `.editorconfig`

- [ ] **Step 1: Create the file**

`2brn_mobile/.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 120

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 2: Commit**

```bash
cd 2brn_mobile
git add .editorconfig
git commit -m "chore: add .editorconfig"
```

---

### Task 5: .github/PULL_REQUEST_TEMPLATE.md

**Files:**
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Verify `.github/` exists**

```bash
ls 2brn_mobile/.github/
```
Expected: `workflows/` directory listed (already exists).

- [ ] **Step 2: Create the file**

`2brn_mobile/.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## What & why

<!-- What does this change do, and why? Link any related issue, e.g. "Closes #123". -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Docs
- [ ] CI / tooling

## Checklist

- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, …)
- [ ] `npm run typecheck` passes (tsc --noEmit)
- [ ] `npm run lint` passes (eslint)
- [ ] `npm test` passes (all jest suites)
- [ ] `npx expo export --platform android` succeeds (bundle smoke-test)
- [ ] Added/updated tests where it makes sense
- [ ] Updated docs (README / `docs/`) where behaviour changed
- [ ] Change is additive and degrades gracefully (no data loss if daemon or LAN is unavailable)

## Notes for reviewers

<!-- Anything tricky, screenshots, or follow-ups. -->
```

- [ ] **Step 3: Commit**

```bash
cd 2brn_mobile
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "chore(ci): add PR template"
```

---

### Task 6: .github/ISSUE_TEMPLATE/bug_report.yml

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p 2brn_mobile/.github/ISSUE_TEMPLATE
```

- [ ] **Step 2: Create the file**

`2brn_mobile/.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: 🐛 Bug report
description: Report something that isn't working as expected
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for filing a bug! 2brn Mobile stores your captures on-device — please **do not**
        paste note content, voice transcripts, or OCR text you wouldn't want to be public.
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: A clear description of the bug and what you expected to happen instead.
    validations:
      required: true
  - type: textarea
    id: repro
    attributes:
      label: Steps to reproduce
      placeholder: |
        1. ...
        2. ...
        3. ...
    validations:
      required: true
  - type: dropdown
    id: component
    attributes:
      label: Component
      options:
        - On-device brain (OCR / STT / LLM)
        - Capture (notes / share / images / voice)
        - Search & memory
        - Desktop companion / pairing
        - UI / screens
        - Other / not sure
    validations:
      required: true
  - type: input
    id: device
    attributes:
      label: Device and Android version
      placeholder: "Pixel 8, Android 14"
    validations:
      required: true
  - type: input
    id: versions
    attributes:
      label: Node / Expo / 2brn-mobile versions
      placeholder: "node 22.4, expo 56, 2brn-mobile commit abc1234"
  - type: textarea
    id: logs
    attributes:
      label: Relevant logs
      description: Metro / logcat output with sensitive content scrubbed.
      render: shell
```

- [ ] **Step 3: Commit**

```bash
cd 2brn_mobile
git add .github/ISSUE_TEMPLATE/bug_report.yml
git commit -m "chore(ci): add bug report issue template"
```

---

### Task 7: .github/ISSUE_TEMPLATE/feature_request.yml + config.yml

**Files:**
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Create feature_request.yml**

`2brn_mobile/.github/ISSUE_TEMPLATE/feature_request.yml`:

```yaml
name: ✨ Feature request
description: Suggest an idea or enhancement
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem / motivation
      description: What are you trying to do? What's missing or painful today?
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: Proposed solution
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
  - type: checkboxes
    id: principles
    attributes:
      label: Alignment with 2brn Mobile's principles
      description: 2brn Mobile is local-first and on-device by design. Please confirm your idea fits.
      options:
        - label: This keeps 2brn local-first (no data sent off-device by default)
        - label: This degrades gracefully if the desktop daemon or LAN is unavailable
```

- [ ] **Step 2: Create config.yml**

`2brn_mobile/.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: 🔒 Report a security vulnerability
    url: https://github.com/SasidharanGS/2brn-mobile/security/advisories/new
    about: Please report security issues privately, not as a public issue. See SECURITY.md.
  - name: 💬 Questions & ideas
    url: https://github.com/SasidharanGS/2brn-mobile/discussions
    about: Ask questions or discuss ideas in Discussions (if enabled).
```

- [ ] **Step 3: Commit**

```bash
cd 2brn_mobile
git add .github/ISSUE_TEMPLATE/feature_request.yml .github/ISSUE_TEMPLATE/config.yml
git commit -m "chore(ci): add feature request template and issue config"
```

---

### Task 8: .github/dependabot.yml

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Create the file**

`2brn_mobile/.github/dependabot.yml`:

```yaml
# Dependabot keeps dependencies up to date with weekly PRs.
# Docs: https://docs.github.com/code-security/dependabot
version: 2
updates:
  # React Native / Expo (npm — root package.json)
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "chore(deps)"
    groups:
      mobile-minor-patch:
        patterns: ["*"]
        update-types: ["minor", "patch"]

  # GitHub Actions workflows
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "chore(ci)"
```

- [ ] **Step 2: Commit**

```bash
cd 2brn_mobile
git add .github/dependabot.yml
git commit -m "chore(ci): add Dependabot config (npm + Actions)"
```

---

### Task 9: Commit the spec + plan docs

**Files:**
- Already created: `docs/superpowers/specs/2026-06-11-opensource-scaffolding-design.md`
- Already created: `docs/superpowers/plans/2026-06-11-opensource-scaffolding.md`

- [ ] **Step 1: Commit the design docs**

```bash
cd 2brn_mobile
git add docs/superpowers/
git commit -m "docs: add open-source scaffolding spec and plan"
```

---

## Verification

After all tasks are done, run:

```bash
cd 2brn_mobile
git log --oneline -10
```

Expected: 9 commits visible, one per file/group.

```bash
ls CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md .editorconfig
ls .github/PULL_REQUEST_TEMPLATE.md .github/dependabot.yml
ls .github/ISSUE_TEMPLATE/
```

Expected: all files present, `ISSUE_TEMPLATE/` contains `bug_report.yml`, `feature_request.yml`, `config.yml`.
