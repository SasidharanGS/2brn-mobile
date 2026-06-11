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
