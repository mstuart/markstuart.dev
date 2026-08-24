# markstuart.dev

Mark Stuart's personal site, built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## Local setup

Use Node 24 and npm 11. The pinned Node version is in `.node-version`, and the npm major is declared in `package.json`.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The site is available at `http://localhost:3000`. The main route is `app/(site)/page.tsx`; the shared site layout is `app/(site)/layout.tsx`.

The public pages render without provider credentials. Add only the environment variables needed for the capability you are exercising. Every supported variable is listed, with a blank value, in `.env.example`.

## Content sources

- `lib/data/resume.ts` is the authoritative source for biography, role history, and career claims.
- Other curated site lists live in `lib/data/` and should not contradict the resume source.
- Local writing lives in `content/posts/*.mdx`; external writing links live in `lib/data/writing.ts`.
- Images and other static assets live under `public/`.

### Publishing an MDX post

Create `content/posts/<slug>.mdx` with `title`, `date`, `description`, and `sample` frontmatter. `teaser` is optional. Use an ISO `YYYY-MM-DD` date and ordinary Markdown or MDX in the body. Set `sample: true` for content that must never trigger subscriber mail.

Before publishing, run the full repository check and review the rendered post, post index, feed, metadata, and links:

```bash
npm run check
```

## Provider-backed capabilities

- Spotify needs the three `SPOTIFY_*` credentials. The one-time OAuth helper uses the documented `127.0.0.1` callback and redacts the refresh token unless `--print-token` is supplied.
- Redis-backed votes, listening history, subscriptions, and mail state accept either the `KV_REST_API_*` pair or the `UPSTASH_REDIS_REST_*` pair. Production voting also needs `VOTE_SECRET`.
- Subscription and inbound mail use Resend plus the capability-specific server variables listed in `.env.example`. Signup is double opt-in; a GET never confirms or unsubscribes a reader.
- Vercel runs daily cron jobs for `/api/spotify/sync` and `/api/notify` from `vercel.json`. Both paths require `CRON_SECRET`.

The complete capability matrix, deployment steps, retry behavior, rollback procedure, secret rotation order, and dashboard checks are in [docs/operations.md](docs/operations.md).

## Verification

Run the focused command while iterating, then the aggregate gate before deployment:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run check
```

`npm run check` runs lint, type checking, the test suite, and a production build.

## Deployment

The production deployment runs on Vercel. Configure capability-specific variables in the Vercel project, deploy from the intended revision, run the checks in `docs/operations.md`, and verify both daily cron jobs in the Vercel dashboard.
