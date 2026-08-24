import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spotifyMock = vi.hoisted(() => ({ getRecentlyPlayed: vi.fn() }));
const redisMock = vi.hoisted(() => ({
  redisConfig: vi.fn(),
  redisCommand: vi.fn(),
  redisPipeline: vi.fn(),
}));

vi.mock("@/lib/spotify", () => ({
  getRecentlyPlayed: spotifyMock.getRecentlyPlayed,
}));

vi.mock("@/lib/server/redis", () => redisMock);

const plays = [
  {
    name: "First",
    artist: "Artist",
    album: "Album",
    playedAt: "2026-08-23T10:00:00.000Z",
  },
  {
    name: "Second",
    artist: "Artist",
    album: "Album",
    playedAt: "2026-08-23T09:00:00.000Z",
  },
];

describe("listening history store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("KV_REST_API_URL", "https://redis.example");
    vi.stubEnv("KV_REST_API_TOKEN", "token");
    redisMock.redisConfig.mockReturnValue({ url: "https://redis.example", token: "token" });
    spotifyMock.getRecentlyPlayed.mockResolvedValue(plays);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("writes an entire sync through one Redis pipeline without changing stored payloads", async () => {
    redisMock.redisPipeline.mockResolvedValue([1, 0]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: 1 })))
    );
    const { syncHistory } = await import("@/lib/listening-store");

    await expect(syncHistory()).resolves.toBe(1);
    expect(redisMock.redisPipeline).toHaveBeenCalledTimes(1);
    expect(redisMock.redisPipeline).toHaveBeenCalledWith(
      plays.map((play) => [
        "ZADD",
        "listening:history",
        "NX",
        String(new Date(play.playedAt).getTime()),
        JSON.stringify(play),
      ])
    );
  });

  it("preserves the exclusive cursor, page size, payload, and next cursor", async () => {
    redisMock.redisCommand.mockResolvedValue(plays.map((play) => JSON.stringify(play)));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ result: plays.map((play) => JSON.stringify(play)) }))
      )
    );
    const { getHistory } = await import("@/lib/listening-store");

    await expect(getHistory(1_777_000_000_000, 2)).resolves.toEqual({
      items: plays,
      nextBefore: new Date(plays[1].playedAt).getTime(),
    });
    expect(redisMock.redisCommand).toHaveBeenCalledWith([
      "ZRANGE",
      "listening:history",
      "(1777000000000",
      "-inf",
      "BYSCORE",
      "REV",
      "LIMIT",
      0,
      2,
    ]);
  });
});
