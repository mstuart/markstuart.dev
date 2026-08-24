# markstuart.dev

[![CI](https://github.com/mstuart/markstuart.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/mstuart/markstuart.dev/actions/workflows/ci.yml)
[![Security audit](https://github.com/mstuart/markstuart.dev/actions/workflows/security-audit.yml/badge.svg)](https://github.com/mstuart/markstuart.dev/actions/workflows/security-audit.yml)

The source for [markstuart.dev](https://markstuart.dev), Mark Stuart's personal
site. It is built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

This repository is private while it is prepared for possible publication. The
source code is available under the MIT License, but that license does not cover
personal content, photographs, other images, third-party marks, or the site's
identity. Read [NOTICE](NOTICE) and the [asset rights ledger](docs/asset-rights.md)
before copying or publishing any part of the repository.

## Local setup

Use exactly Node 24.19.0 and npm 11.19.0. The versions are declared in
`.node-version`, `package.json`, and `package-lock.json`.

```bash
npm ci
cp .env.example .env.local
npm run runtime
npm run dev
```

The site is available at `http://localhost:3000`. The home page begins at
`app/(site)/page.tsx`, with shared site layout in `app/(site)/layout.tsx`.
Public pages render without provider credentials; add only the blank variables
from `.env.example` needed for the capability under test.

Run `npm run help` for the command index. The primary commands are:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm test` | Run the test suite once. |
| `npm run coverage` | Run tests and enforce coverage thresholds. |
| `npm run lint` | Run ESLint with zero warnings allowed. |
| `npm run typecheck` | Generate Next.js route types and check TypeScript. |
| `npm run policy` | Reject prohibited tracked repository artifacts. |
| `npm run build` | Create the production build. |
| `npm run smoke` | Start that build and probe successful and missing routes. |
| `npm run check` | Run the complete repository gate. |

## Content sources

- `lib/data/resume.ts` is authoritative for biography, role history, and career
  claims. Other curated lists must not contradict it.
- Local writing lives in `content/posts/*.mdx`; external writing links live in
  `lib/data/writing.ts`.
- Static assets live under `public/` and require a corresponding rights review.

To publish an MDX post, create `content/posts/<slug>.mdx` with `title`, `date`,
`description`, and `sample` frontmatter. Use an ISO `YYYY-MM-DD` date. A sample
post must never trigger subscriber mail. Run `npm run check` and review the
rendered post, index, feed, metadata, and links before publishing.

## Routes and provider-backed capabilities

| Capability | Route or entry point | Operational contract |
| --- | --- | --- |
| Listening history | `/listening`, `/api/listening` | Shows a bounded, week-coarsened history. Redis is required for retained production history. |
| Live Spotify status | `/api/spotify/now-playing` | Intentionally unavailable (`410`) so the public site does not expose live presence. |
| Spotify history sync | `/api/spotify/sync` | Vercel schedules the daily `/api/spotify/sync` job; requests require `CRON_SECRET`. |
| Post notification | `/api/notify` | Vercel schedules the daily `/api/notify` job; requests require `CRON_SECRET`. |
| Subscription signup | `POST /api/subscribe` | Starts double opt-in and returns a generic accepted response. |
| Confirmation | `GET /subscribe/confirm`, then deliberate form POST | GET renders state and never confirms a subscription. |
| Unsubscribe | `GET /api/unsubscribe`, then deliberate `POST /api/unsubscribe`; RFC 8058 one-click POST uses the same endpoint | GET never unsubscribes a reader. |
| Inbound email | `POST /api/email/inbound` | Requires the raw signed Resend webhook body and Svix headers. |
| Votes and durable mail/listening state | API routes backed by Redis | Production requires one complete supported Redis credential pair. |

All supported variables are listed blank in `.env.example`. The complete
capability matrix, webhook verification details, retry and reconciliation
rules, deployment checks, rollback procedure, and secret rotation order are in
[the operations runbook](docs/operations.md).

## Public forks

Before making a fork public:

1. Replace the site owner's name, biography, resume, writing, portraits, and
   site identity.
2. Remove or replace every asset whose transferable rights are not documented
   in `docs/asset-rights.md`; do not imply endorsement by an employer,
   publication, conference, or product vendor.
3. Replace production URLs, analytics, email identities, webhook endpoints,
   cron configuration, and provider projects with accounts you control.
4. Review the entire Git history for secrets and private content. Deleting a
   file in the latest commit does not remove it from history.
5. Keep `.env` files and credentials untracked, run `npm run policy`, and run
   the complete `npm run check` gate.

See [CONTRIBUTING.md](CONTRIBUTING.md) for changes, [SECURITY.md](SECURITY.md)
for private vulnerability reports, [SUPPORT.md](SUPPORT.md) for help, and
[docs/contributor-tooling.md](docs/contributor-tooling.md) for vendored agent
skills and Windows symbolic-link behavior.
