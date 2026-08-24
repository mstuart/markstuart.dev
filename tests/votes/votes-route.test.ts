import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/votes/route";

const ENV_KEYS = [
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "VOTE_SECRET",
] as const;

afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("votes route", () => {
  it("fails closed in production when Redis is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.VOTE_SECRET = "vote-secret";

    const response = await GET(new Request("https://example.test/api/votes?slug=hello-world"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "not_configured" } });
  });

  it("sets a signed, httpOnly anonymous voter cookie", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.VOTE_SECRET = "vote-secret";
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json({ result: 0 }))));

    const response = await GET(new Request("https://example.test/api/votes?slug=hello-world"));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(
      /^mark-voter=[0-9a-f-]+\.[0-9a-f]+; Path=\/; Max-Age=31536000; HttpOnly; SameSite=Lax$/,
    );
  });

  it("rejects a tampered voter cookie by issuing a fresh signed identity", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.VOTE_SECRET = "vote-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        const command = JSON.parse(String(init?.body)) as string[];
        return Promise.resolve(Response.json({ result: command[0] === "EVAL" ? [1, 1] : 0 }));
      }),
    );

    const response = await POST(
      new Request("https://example.test/api/votes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "mark-voter=00000000-0000-4000-8000-000000000000.tampered",
        },
        body: JSON.stringify({ slug: "hello-world" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("mark-voter=");
  });

  it("keeps a signed voter identity idempotent across repeated vote requests", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.VOTE_SECRET = "vote-secret";
    const voters = new Set<string>();
    let votes = 0;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const command = JSON.parse(String(init?.body)) as (string | number)[];
      if (command[0] === "EVAL") {
        const voterKey = `${command[3]}:${command[5]}`;
        if (!voters.has(voterKey)) {
          voters.add(voterKey);
          votes += 1;
        }
        return Promise.resolve(Response.json({ result: [votes, 1] }));
      }
      return Promise.resolve(Response.json({ result: 0 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const initial = await GET(new Request("https://example.test/api/votes?slug=hello-world"));
    const voterCookie = initial.headers.get("set-cookie")?.split(";", 1)[0];

    expect(voterCookie).toMatch(/^mark-voter=[0-9a-f-]+\.[0-9a-f]+$/);

    const request = () =>
      POST(
        new Request("https://example.test/api/votes", {
          method: "POST",
          headers: { "content-type": "application/json", cookie: voterCookie! },
          body: JSON.stringify({ slug: "hello-world" }),
        }),
      );
    const [first, second] = await Promise.all([request(), request()]);

    await expect(first.json()).resolves.toEqual({ votes: 1, voted: true });
    await expect(second.json()).resolves.toEqual({ votes: 1, voted: true });
    expect(first.headers.get("set-cookie")).toBeNull();
    expect(second.headers.get("set-cookie")).toBeNull();
    expect(fetchMock.mock.calls.filter(([, init]) => JSON.parse(String(init?.body))[0] === "EVAL")).toHaveLength(2);
  });
});
