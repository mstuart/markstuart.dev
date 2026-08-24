import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : "");

describe("repository documentation", () => {
  it("points contributors at the real app entry point and verification command", () => {
    const readme = read("README.md");

    expect(readme).toContain("app/(site)/page.tsx");
    expect(readme).toContain("npm run check");
    expect(readme).toContain("lib/data/resume.ts");
    expect(readme).toMatch(/daily[^\n]*\/api\/spotify\/sync/i);
    expect(readme).toMatch(/daily[^\n]*\/api\/notify/i);
    expect(readme).not.toMatch(/idempotency secrets?/i);
  });

  it("keeps every application environment entry blank and omits retired providers", () => {
    const example = read(".env.example");
    const entries = [...example.matchAll(/^([A-Z][A-Z0-9_]*)=(.*)$/gm)];
    const names = entries.map(([, name]) => name).sort();

    expect(names).toEqual(
      [
        "CRON_SECRET",
        "INBOUND_FORWARD_TO",
        "KV_REST_API_TOKEN",
        "KV_REST_API_URL",
        "RATE_LIMIT_SECRET",
        "RESEND_API_KEY",
        "RESEND_WEBHOOK_SECRET",
        "SPOTIFY_CLIENT_ID",
        "SPOTIFY_CLIENT_SECRET",
        "SPOTIFY_REFRESH_TOKEN",
        "SPOTIFY_SETUP_NO_OPEN",
        "UPSTASH_REDIS_REST_TOKEN",
        "UPSTASH_REDIS_REST_URL",
        "VOTE_SECRET",
      ].sort()
    );
    expect(entries.every(([, , value]) => value === "")).toBe(true);
    expect(example).not.toMatch(/buttondown/i);
  });

  it("documents safe subscription, cron, rollback, and rotation operations", () => {
    const operations = read("docs/operations.md");

    expect(operations).toMatch(/double opt-in/i);
    expect(operations).toMatch(/GET[^\n]*never[^\n]*confirm/i);
    expect(operations).toContain("/api/spotify/sync");
    expect(operations).toContain("/api/notify");
    expect(operations).toMatch(/roll back/i);
    expect(operations).toMatch(/rotate/i);
    expect(operations).toMatch(/provider health/i);
    expect(operations).toMatch(/dashboard/i);
    expect(operations).toContain("INBOUND_FORWARD_TO");
    expect(operations).toMatch(/INBOUND_FORWARD_TO[^\n]*(server-only|private)/i);
    expect(operations).not.toContain("MAIL_IDEMPOTENCY_SECRET");
    expect(operations).toMatch(/three immediate[^\n]*same[^\n]*idempotency key/i);
    expect(operations).toMatch(/next daily[^\n]*\/api\/notify/i);
    expect(operations).toMatch(/23-hour[^\n]*ambiguous[^\n]*fail[^\n]*closed/i);
    expect(operations).toMatch(/quarantin[^\n]*operator reconciliation/i);
    expect(operations).toMatch(/inbound[^\n]*ambiguous[^\n]*fail[^\n]*closed/i);
  });

  it("keeps Task 10-owned visible non-biographical copy free of em and en dashes", () => {
    const visibleCopy = [
      "app/not-found.tsx",
      "app/(site)/error.tsx",
      "app/(site)/loading.tsx",
      "lib/data/all-projects.ts",
      "lib/data/community.ts",
      "lib/data/projects.ts",
      "content/posts/hello-world.mdx",
    ]
      .map(read)
      .join("\n");

    expect(visibleCopy).not.toMatch(/[—–]/);
  });
});
