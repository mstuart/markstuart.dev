# Contributing

Thank you for helping improve markstuart.dev. This is a personal website, so a
change should be narrowly scoped and must not rewrite biographical claims,
personal voice, or design identity without explicit maintainer direction.

## Before starting

- Use Node 24.19.0 and npm 11.19.0.
- Read `README.md`, `NOTICE`, and `docs/asset-rights.md`.
- Never commit credentials, `.env` values, subscriber or inbound-email data,
  provider payloads, local paths, or agent planning artifacts.
- Do not add personal or third-party media without recording its provenance,
  rights basis, and required attribution in the asset ledger.
- Keep public pages usable without optional provider credentials.

## Development workflow

1. Create a focused branch and install the locked dependency tree with
   `npm ci`.
2. Add or update a test that demonstrates the requested behavior and verify it
   fails for the expected reason.
3. Make the smallest implementation change that passes the test.
4. Run the focused test while iterating, then `npm run check` before requesting
   review.
5. Update documentation only when behavior or contributor workflow changes.

Pull requests should explain the user-visible effect, testing performed,
privacy or provider implications, and any asset provenance. Keep unrelated
cleanup in a separate change. Screenshots must use synthetic data and must not
expose private dashboards, messages, addresses, tokens, or local paths.

By contributing code, tests, configuration, or project documentation, you
agree that it may be distributed under the MIT License. Do not submit material
you do not have the right to contribute. Personal content and reserved assets
remain outside the MIT grant described in `NOTICE`.

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). For
security issues, follow [SECURITY.md](SECURITY.md), not the public issue tracker.
