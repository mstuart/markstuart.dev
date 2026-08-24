import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/spotify/sync/route";

afterEach(() => {
  delete process.env.CRON_SECRET;
  delete process.env.SPOTIFY_CLIENT_ID;
  delete process.env.SPOTIFY_CLIENT_SECRET;
  delete process.env.SPOTIFY_REFRESH_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Spotify sync route", () => {
  it("rejects an unauthenticated Spotify sync", async () => {
    const response = await GET(new Request("https://example.test/api/spotify/sync"));

    expect(response.status).toBe(401);
  });

  it("returns a generic correlated failure without provider details", async () => {
    process.env.CRON_SECRET = "cron-secret";
    process.env.SPOTIFY_CLIENT_ID = "client-id";
    process.env.SPOTIFY_CLIENT_SECRET = "client-secret";
    process.env.SPOTIFY_REFRESH_TOKEN = "refresh-token";
    process.env.KV_REST_API_URL = "https://redis.example";
    process.env.KV_REST_API_TOKEN = "redis-token";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("provider detail: secret-value")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(
      new Request("https://example.test/api/spotify/sync", {
        headers: { authorization: "Bearer cron-secret" },
      }),
    );
    const body = (await response.json()) as { error: { code: string; correlationId: string } };

    expect(response.status).toBe(500);
    expect(body).toMatchObject({ error: { code: "sync_failed" } });
    expect(body.error.correlationId).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toContain("provider detail");
    expect(JSON.stringify(body)).not.toContain("secret-value");
  });
});
