# Operations

This runbook covers the provider-backed parts of markstuart.dev. The public content pages do not require provider credentials.

## Runtime and verification

Use Node 24.19.0 and npm 11.19.0. Install with `npm ci`, run `npm run runtime`, copy `.env.example` to `.env.local`, and fill only the variables required for the capability under test. Run `npm run check` before every deployment; it checks repository policy and runtime, allows zero lint warnings, type-checks, tests with coverage, builds, and probes a real production server.

For the automated production smoke, run `npm run build && npm run smoke`; it starts `next start` on IPv4 loopback and requires `/` to return 200 and an unknown route to return 404. For a broader manual check, start `npm run dev` and verify `/`, `/projects`, `/posts`, one local post, `/listening`, and an unknown path. Confirm that missing optional providers produce the documented unavailable or degraded state rather than a crash.

## Environment variables by capability

All assignments in `.env.example` are deliberately blank.

| Capability | Variables | Requirement |
| --- | --- | --- |
| Redis compatibility | `KV_REST_API_URL` + `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Use one complete pair. Required in production for durable votes, listening history, subscriptions, and mail delivery state. |
| Spotify | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | Required for the private daily sync that populates bounded listening history. Public live status is intentionally disabled. `SPOTIFY_SETUP_NO_OPEN` is an optional local-helper switch. |
| Cron authorization | `CRON_SECRET` | Required for both scheduled routes and any manual invocation. |
| Voting | `VOTE_SECRET` | Required in production to sign the anonymous voter cookie. |
| Signup rate limits | `RATE_LIMIT_SECRET` | Required when subscriptions are enabled; it prevents raw client identifiers from becoming Redis keys. |
| Resend | `RESEND_API_KEY` | Required for confirmation, welcome, post notification, and inbound forwarding. |
| Resend inbound verification | `RESEND_WEBHOOK_SECRET` | Required only when the inbound webhook is enabled. |
| Inbound forwarding destination | `INBOUND_FORWARD_TO` | Required server-only private address when inbound forwarding is enabled. Never expose its value in client code, responses, logs, or documentation. |

The application also reads the platform-provided `NODE_ENV`; do not add or override it in `.env.local` or Vercel.

## Redis compatibility

The Redis adapter accepts Vercel KV-compatible and direct Upstash REST credentials. Do not combine a URL from one pair with a token from the other. The application fails closed when configuration is incomplete. Production must not rely on local JSON fallbacks.

Before a deploy, check the provider dashboard for availability and confirm that the selected database is the intended production database. After a deploy, exercise one non-destructive read path and inspect function logs for authentication, timeout, or rate-limit errors. Do not delete keys as part of a smoke test or rollback.

## Production provider smoke

Run `npm run smoke:providers` after a production deployment. Pass a different
origin only when checking an isolated environment:

```bash
npm run smoke:providers -- https://markstuart.dev
```

The command performs unauthenticated GET requests only. It checks the retained
listening window and read-only vote state, confirms that an invalid unsubscribe
token remains inert, verifies that live Spotify presence stays unavailable,
and tests both cron authorization and the method boundaries on subscription and
inbound-email routes. It never prints response bodies or cookies, follows no
subscription or confirmation flow, and sends no authorization header.

Before calling the result complete, compare Vercel environment variable names,
never values. Require one complete Redis pair plus the variables for each
enabled capability. Confirm that the deployed cron definitions match
`vercel.json`. In Resend, read only domain and webhook configuration: the
sending and receiving domain must be verified, and one enabled
`email.received` webhook must point exactly to
`https://markstuart.dev/api/email/inbound`.

Routine smoke must never invoke an authenticated cron route, write a vote,
submit a subscription, or post an inbound event. End-to-end mail verification
requires a controlled test inbox and deliberate approval. Inbound verification
also requires one controlled signed event and one controlled forwarding
destination. Do not test `/api/notify` against production subscribers. A
preview mail test must first use a disposable Redis database or an explicitly
isolated key namespace.

## Spotify OAuth and sync

Register only `http://127.0.0.1:8888/callback` for the local helper. Then run:

```bash
SPOTIFY_CLIENT_ID="$SPOTIFY_CLIENT_ID" \
SPOTIFY_CLIENT_SECRET="$SPOTIFY_CLIENT_SECRET" \
node scripts/spotify-setup.mjs
```

The helper binds only to IPv4 loopback, validates a high-entropy OAuth state, and confirms receipt without printing the refresh token. To copy the token during the one-time setup, rerun with the explicit `--print-token` flag in a private terminal. Store the result directly in the local and Vercel secret stores; do not paste it into issues, logs, or documentation.

`/api/spotify/sync` runs daily at 08:00 UTC. It requires the Vercel cron bearer credential and is safe to retry after a transient failure. Verify the latest run and response status in the Vercel dashboard, then check Spotify provider health before changing credentials or code.

## Subscription lifecycle

Signup is double opt-in:

1. `POST /api/subscribe` normalizes the address, applies per-address and hashed-client limits, stores a 48-hour pending confirmation, and always returns the same accepted response for syntactically valid input.
2. `GET /subscribe/confirm?token=...` only renders the confirmation state. GET must never confirm a subscription.
3. A deliberate form POST atomically consumes the token, adds the confirmed subscriber, clears suppression, and sends the welcome message once.
4. A human unsubscribe GET only renders a confirmation form. Its form POST suppresses the address. RFC 8058 one-click POST is the only automated, no-human-confirmation unsubscribe path.

GET does not confirm a subscription or unsubscribe a reader. Confirmation and
human unsubscribe changes require deliberate POST requests; the standards-based
one-click unsubscribe is also a POST.

Never inspect or copy subscriber addresses during routine verification. Use an address controlled for testing, confirm that duplicate GETs cause no state change, and remove or suppress the test subscription through the public flow.

## Notification and inbound mail

`/api/notify` runs daily at 08:30 UTC. It uses a five-minute lock, provider idempotency keys, and a completed-recipient set per post. Retrying the same post skips recipients already recorded as complete; it must not restart a partially successful delivery from the beginning. Sample posts never send mail.

Confirmation and welcome jobs are durable. Each runnable lifecycle job makes up to three immediate provider attempts with the same idempotency key. If all three fail, the job remains available to the next daily `/api/notify` drain. A drain inside the 23-hour provider-key window may retry with that same key; once an unfinished attempt is 23 hours old, it is ambiguous and fails closed without sending. The job is quarantined for operator reconciliation so it cannot block later runnable mail.

Configure Resend to send `email.received` events to `POST /api/email/inbound`.
The route requires the raw signed body plus the `svix-id`, `svix-timestamp`,
and `svix-signature` headers. It verifies the signature with
`RESEND_WEBHOOK_SECRET` before reading event data, accepts only the expected
event shape, limits webhook and message sizes, downloads raw mail only from an
HTTPS provider URL, and deduplicates by the verified event identifier.

An inbound failure is retryable with the same provider idempotency key only inside the 23-hour provider-key window; an older unfinished inbound attempt is ambiguous and fails closed for operator reconciliation. Completion is recorded only after the provider accepts the forward. Configure the private destination only through the server-side `INBOUND_FORWARD_TO` secret, and compare only the variable name when checking deployment configuration. Browser responses and logs must stay generic and must not include message bodies, recipient addresses, destinations, tokens, or provider error payloads.

To validate configuration, use a provider-controlled test event with a test
mailbox and inspect only the HTTP status, sanitized correlation ID, and durable
completion state. Do not replay a captured production body, weaken signature
verification, or paste webhook headers into issues.

For a provider incident, check Resend provider health and the Vercel function logs. Retry only after the provider recovers and only while the durable attempt remains inside its safe window. Confirm that no run is still holding the notification lock and that completion state exists before triggering another attempt. Never force an ambiguous or quarantined delivery; reconcile it with provider state first.

## Deployment

1. Run `npm ci` and `npm run check` from the exact revision to deploy.
2. Confirm the required environment variables exist in the correct Vercel environment. Compare names and capability coverage, never values.
3. Deploy a preview and smoke-check content, recovery states, provider-degraded states, subscription GET safety, and response headers.
4. Promote the verified revision to production.
5. In the Vercel dashboard, confirm the production revision, function health, and the daily `/api/spotify/sync` and `/api/notify` schedules.
6. Check Redis, Spotify, and Resend provider health dashboards. Review only sanitized application logs.

Do not manually invoke `/api/notify` merely as a smoke test. A real invocation can send mail. Use automated tests and dashboard state unless a deliberate delivery has been approved.

## Retry and rollback

For a transient route failure, preserve Redis state and retry the same operation after provider recovery only within the documented safe window. The mail path's lock, attempt state, and recipient completion records make an in-window same-post retry safe; do not clear them to force a restart or bypass fail-closed reconciliation.

To roll back:

1. Stop manual retries and record the failing deployment and route correlation IDs without copying request data.
2. Promote the last verified Vercel deployment or redeploy its exact revision with the previous environment configuration.
3. Do not delete or rewrite Redis keys. The lifecycle and completion records must survive the application rollback.
4. Re-run the non-destructive dashboard and content smoke checks. Inspect notification completion state before allowing the next cron run.
5. Open a follow-up change for the defect; do not patch production data to compensate for application behavior.

## Secret and token rotation

Generate a separate random value for every signing purpose. Rotate one capability at a time, deploy, verify, and only then revoke the prior credential where the provider supports overlap.

- Redis: create or select the replacement credential, update the URL/token pair together, deploy, verify a non-destructive read, then revoke the old credential.
- Spotify: update the client secret or refresh token in Vercel, deploy, verify the daily sync path, then revoke the old credential.
- Resend API and webhook: establish the replacement in Resend first, update Vercel, deploy, verify signed webhook delivery, then disable the old credential or endpoint.
- `CRON_SECRET`: update the Vercel environment and redeploy before the next schedule. Verify unauthorized requests still fail and dashboard cron runs still succeed.
- `VOTE_SECRET`: expect existing anonymous voter cookies to become invalid. Rotate during a quiet window and verify a fresh signed cookie without altering vote totals.
- `RATE_LIMIT_SECRET`: rotation starts new hashed-client buckets. Avoid rotating during an abuse event.

After any rotation, repeat the Vercel dashboard smoke checks and the relevant provider health check. Never print secret values while comparing configuration.
