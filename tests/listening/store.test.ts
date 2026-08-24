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

  it("retains only the newest 500 plays without counting trimmed rows as additions", async () => {
    redisMock.redisPipeline.mockResolvedValue([1, 0, 37]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: 1 })))
    );
    const { syncHistory } = await import("@/lib/listening-store");

    await expect(syncHistory()).resolves.toBe(1);
    expect(redisMock.redisPipeline).toHaveBeenCalledTimes(1);
    expect(redisMock.redisPipeline).toHaveBeenCalledWith([
      ...plays.map((play) => [
        "ZADD",
        "listening:history",
        "NX",
        String(new Date(play.playedAt).getTime()),
        JSON.stringify(play),
      ]),
      ["ZREMRANGEBYRANK", "listening:history", "0", "-501"],
    ]);
  });

  it("does not read Spotify when retained history is not configured", async () => {
    redisMock.redisConfig.mockReturnValue(null);
    const { syncHistory } = await import("@/lib/listening-store");

    await expect(syncHistory()).resolves.toBe(0);
    expect(spotifyMock.getRecentlyPlayed).not.toHaveBeenCalled();
  });

  it("publishes week-level play dates behind an offset cursor", async () => {
    const storedPlays = [
      ...plays,
      {
        name: "Third",
        artist: "Artist",
        album: "Album",
        playedAt: "2026-08-22T23:00:00.000Z",
      },
    ];
    redisMock.redisCommand.mockResolvedValue(storedPlays.map((play) => JSON.stringify(play)));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ result: storedPlays.map((play) => JSON.stringify(play)) }))
      )
    );
    const { getHistory } = await import("@/lib/listening-store");

    await expect(getHistory(30, 2)).resolves.toEqual({
      items: [
        { name: "First", artist: "Artist", album: "Album", playedDuring: "2026-08-17" },
        { name: "Second", artist: "Artist", album: "Album", playedDuring: "2026-08-17" },
      ],
      nextCursor: 32,
    });
    expect(redisMock.redisCommand).toHaveBeenCalledWith([
      "ZRANGE",
      "listening:history",
      30,
      32,
      "REV",
    ]);
  });

  it("does not query history beyond the 90-item public window", async () => {
    const { getHistory } = await import("@/lib/listening-store");

    await expect(getHistory(90, 30)).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
    expect(redisMock.redisCommand).not.toHaveBeenCalled();
  });

  it("ends pagination at 90 even when retained history has a 91st item", async () => {
    const finalWindow = Array.from({ length: 31 }, (_, index) =>
      JSON.stringify({
        name: `Track ${index + 61}`,
        artist: "Artist",
        album: "Album",
        playedAt: "2026-08-23T10:00:00.000Z",
      })
    );
    redisMock.redisCommand.mockResolvedValue(finalWindow);
    const { getHistory } = await import("@/lib/listening-store");

    const page = await getHistory(60, 30);

    expect(page.items).toHaveLength(30);
    expect(page.nextCursor).toBeNull();
    expect(redisMock.redisCommand).toHaveBeenCalledWith([
      "ZRANGE",
      "listening:history",
      60,
      90,
      "REV",
    ]);
  });
});
