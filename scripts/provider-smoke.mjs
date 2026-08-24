#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const TIMEOUT_MS = 10_000;

export const PROVIDER_PROBES = Object.freeze([
  {
    label: "Redis-backed listening history",
    path: "/api/listening?cursor=60",
    expectedStatus: 200,
    validate: (body) => body?.status === "ok",
  },
  {
    label: "Read-only vote state",
    path: "/api/votes?slug=hello-world",
    expectedStatus: 200,
  },
  {
    label: "Invalid unsubscribe token",
    path: "/api/unsubscribe?token=provider-smoke-invalid",
    expectedStatus: 400,
  },
  {
    label: "Disabled live Spotify presence",
    path: "/api/spotify/now-playing",
    expectedStatus: 410,
    validate: (body) => body?.status === "unavailable",
  },
  {
    label: "Spotify cron authorization",
    path: "/api/spotify/sync",
    expectedStatus: 401,
  },
  {
    label: "Notification cron authorization",
    path: "/api/notify",
    expectedStatus: 401,
  },
  {
    label: "Subscription method boundary",
    path: "/api/subscribe",
    expectedStatus: 405,
  },
  {
    label: "Inbound email method boundary",
    path: "/api/email/inbound",
    expectedStatus: 405,
  },
]);

function safeBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Provider smoke base URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Provider smoke base URL must not contain credentials.");
  }
  return url.origin;
}

async function bodyMatches(response, validate) {
  if (!validate) return true;
  try {
    return validate(await response.json());
  } catch {
    return false;
  }
}

export async function runProviderSmoke({
  baseUrl = "https://markstuart.dev",
  fetchImpl = globalThis.fetch,
} = {}) {
  const origin = safeBaseUrl(baseUrl);
  const results = [];

  for (const probe of PROVIDER_PROBES) {
    try {
      const response = await fetchImpl(new URL(probe.path, origin), {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const validBody = response.status === probe.expectedStatus
        ? await bodyMatches(response, probe.validate)
        : true;
      results.push({
        label: probe.label,
        ok: response.status === probe.expectedStatus && validBody,
        expectedStatus: probe.expectedStatus,
        status: response.status,
        reason: response.status !== probe.expectedStatus
          ? "unexpected_status"
          : validBody
            ? undefined
            : "unexpected_body",
      });
    } catch {
      results.push({
        label: probe.label,
        ok: false,
        expectedStatus: probe.expectedStatus,
        status: null,
        reason: "request_failed",
      });
    }
  }

  return results;
}

async function main() {
  const [baseUrl = "https://markstuart.dev", ...extra] = process.argv.slice(2);
  if (extra.length > 0) throw new Error("Usage: npm run smoke:providers -- [base-url]");

  const results = await runProviderSmoke({ baseUrl });
  for (const result of results) {
    const actual = result.status ?? "request failed";
    const suffix = result.ok ? "" : `, expected ${result.expectedStatus}`;
    console.log(`${result.ok ? "PASS" : "FAIL"} ${result.label}: ${actual}${suffix}`);
  }
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Provider smoke failed.");
    process.exitCode = 1;
  });
}
