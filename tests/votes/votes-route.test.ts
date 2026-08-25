import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/votes/route";
import { useFixturePosts } from "@/tests/fixtures/use-fixture-posts";

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
  useFixturePosts();

  it("rejects non-JSON and cross-site vote posts before touching vote storage", async () => {
    const nonJson = await POST(
      new Request("https://example.test/api/votes", {
        method: "POST",
        headers: { "content-type": "text/plain", origin: "https://example.test" },
        body: JSON.stringify({ slug: "coding-agent-infrastructure" }),
      }),
    );
    const crossSite = await POST(
      new Request("https://example.test/api/votes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://attacker.example",
          "sec-fetch-site": "cross-site",
        },
        body: JSON.stringify({ slug: "coding-agent-infrastructure" }),
      }),
    );

    expect(nonJson.status).toBe(415);
    await expect(nonJson.json()).resolves.toMatchObject({ error: { code: "unsupported_media_type" } });
    expect(crossSite.status).toBe(403);
    await expect(crossSite.json()).resolves.toMatchObject({ error: { code: "cross_site_request" } });
  });

  it("fails closed in production when Redis is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.VOTE_SECRET = "vote-secret";

    const response = await GET(new Request("https://example.test/api/votes?slug=coding-agent-infrastructure"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "not_configured" } });
  });

  it("sets a signed, httpOnly anonymous voter cookie", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.VOTE_SECRET = "vote-secret";
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json({ result: [0, 0] }))));

    const response = await GET(new Request("https://example.test/api/votes?slug=coding-agent-infrastructure"));

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
          origin: "https://example.test",
          cookie: "mark-voter=00000000-0000-4000-8000-000000000000.tampered",
        },
        body: JSON.stringify({ slug: "coding-agent-infrastructure" }),
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
        const argumentStart = 3 + Number(command[2]);
        const isAdd = Number(command[2]) === 4;
        const voterKey = String(command[argumentStart + (isAdd ? 6 : 3)]);
        if (!isAdd) {
          return Promise.resolve(Response.json({ result: [votes, voters.has(voterKey) ? 1 : 0] }));
        }
        if (!voters.has(voterKey)) {
          voters.add(voterKey);
          votes += 1;
        }
        return Promise.resolve(Response.json({ result: [votes, 1] }));
      }
      return Promise.resolve(Response.json({ result: 0 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const initial = await GET(new Request("https://example.test/api/votes?slug=coding-agent-infrastructure"));
    const voterCookie = initial.headers.get("set-cookie")?.split(";", 1)[0];

    expect(voterCookie).toMatch(/^mark-voter=[0-9a-f-]+\.[0-9a-f]+$/);

    const request = () =>
      POST(
        new Request("https://example.test/api/votes", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://example.test",
            cookie: voterCookie!,
          },
          body: JSON.stringify({ slug: "coding-agent-infrastructure" }),
        }),
      );
    const [first, second] = await Promise.all([request(), request()]);

    await expect(first.json()).resolves.toEqual({ votes: 1, voted: true });
    await expect(second.json()).resolves.toEqual({ votes: 1, voted: true });
    expect(first.headers.get("set-cookie")).toBeNull();
    expect(second.headers.get("set-cookie")).toBeNull();
    expect(fetchMock.mock.calls.filter(([, init]) => JSON.parse(String(init?.body))[0] === "EVAL")).toHaveLength(3);
  });

  it("permits a bounded number of fresh voters on one shared network", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.VOTE_SECRET = "vote-secret";
    let votes = 0;
    let freshVotes = 0;
    const clientIp = "203.0.113.9";
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const command = JSON.parse(String(init?.body)) as (string | number)[];
      if (command[0] !== "EVAL") return Promise.resolve(Response.json({ result: 0 }));
      if (String(command[1]).includes("redis.call('SADD'")) {
        freshVotes += 1;
        if (freshVotes > 3) {
          return Promise.resolve(Response.json({ result: [votes, 0, "client_limit", 90] }));
        }
        votes += 1;
        return Promise.resolve(Response.json({ result: [votes, 1, "added"] }));
      }
      return Promise.resolve(Response.json({ result: [1, 3600] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const vote = () =>
      POST(
        new Request("https://example.test/api/votes", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://example.test",
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify({ slug: "coding-agent-infrastructure" }),
        }),
      );

    await expect((await vote()).json()).resolves.toEqual({ votes: 1, voted: true });
    await expect((await vote()).json()).resolves.toEqual({ votes: 2, voted: true });
    await expect((await vote()).json()).resolves.toEqual({ votes: 3, voted: true });
    const limited = await vote();

    expect(limited.status).toBe(429);
    await expect(limited.json()).resolves.toMatchObject({ error: { code: "vote_rate_limited" } });
    expect(limited.headers.get("retry-after")).toBe("90");
    expect(limited.headers.get("set-cookie")).toBeNull();
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(clientIp);
  });

  it("preserves the durable total when the identity window evicts its oldest entry", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.VOTE_SECRET = "vote-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        const command = JSON.parse(String(init?.body)) as (string | number)[];
        return Promise.resolve(
          Response.json({
            result: String(command[1]).includes("redis.call('SADD'")
              ? [25_001, 1, "added", 0]
              : [1, 60],
          }),
        );
      }),
    );

    const response = await POST(
      new Request("https://example.test/api/votes", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://example.test" },
        body: JSON.stringify({ slug: "coding-agent-infrastructure" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ votes: 25_001, voted: true });
    expect(response.headers.get("set-cookie")).toContain("mark-voter=");
  });

  it("rate limits repeated fresh identities without setting a bypass cookie", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.VOTE_SECRET = "vote-secret";
    const clientIp = "203.0.113.10";
    let requests = 0;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const command = JSON.parse(String(init?.body)) as (string | number)[];
      if (String(command[1]).includes("local current = redis.call('INCR'")) {
        requests += 1;
        return Promise.resolve(Response.json({ result: [requests, 42] }));
      }
      return Promise.resolve(Response.json({ result: [1, 1] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = () =>
      POST(
        new Request("https://example.test/api/votes", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://example.test",
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify({ slug: "coding-agent-infrastructure" }),
        }),
      );

    for (let index = 0; index < 10; index += 1) {
      expect((await request()).status).toBe(200);
    }
    const limited = await request();

    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("42");
    expect(limited.headers.get("set-cookie")).toBeNull();
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(clientIp);
  });
});
