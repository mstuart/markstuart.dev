import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spotifyMock = vi.hoisted(() => ({
  isSpotifyConfigured: vi.fn(),
  getNowPlaying: vi.fn(),
}));
const storeMock = vi.hoisted(() => ({
  getHistory: vi.fn(),
  isHistoryConfigured: vi.fn(),
}));
const logMock = vi.hoisted(() => ({ logServerError: vi.fn() }));

vi.mock("@/lib/spotify", () => spotifyMock);
vi.mock("@/lib/listening-store", () => storeMock);
vi.mock("@/lib/server/log", () => logMock);

describe("listening API boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spotifyMock.isSpotifyConfigured.mockReturnValue(true);
    storeMock.isHistoryConfigured.mockReturnValue(true);
  });

  afterEach(() => vi.restoreAllMocks());

  it("returns a typed unavailable result when Spotify is not configured", async () => {
    spotifyMock.isSpotifyConfigured.mockReturnValue(false);
    const { GET } = await import("@/app/api/spotify/now-playing/route");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "unavailable",
      reason: "not_configured",
    });
  });

  it("logs provider failures and returns a safe typed unavailable result", async () => {
    spotifyMock.getNowPlaying.mockRejectedValue(new Error("secret provider body"));
    const { GET } = await import("@/app/api/spotify/now-playing/route");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "unavailable",
      reason: "spotify_unavailable",
    });
    expect(logMock.logServerError).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "spotify.now_playing", provider: "spotify" })
    );
  });

  it("wraps listening history in the same typed success boundary", async () => {
    const page = { items: plays, nextBefore: null };
    storeMock.getHistory.mockResolvedValue(page);
    const { GET } = await import("@/app/api/listening/route");

    const response = await GET(new Request("https://example.test/api/listening"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", data: page });
  });

  it("uses the shared safe error envelope for an invalid cursor", async () => {
    const { GET } = await import("@/app/api/listening/route");

    const response = await GET(new Request("https://example.test/api/listening?before=nope"));
    const body = (await response.json()) as {
      error: { code: string; correlationId: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_cursor");
    expect(body.error.correlationId).toEqual(expect.any(String));
  });
});

const plays = [
  {
    name: "Song",
    artist: "Artist",
    album: "Album",
    playedAt: "2026-08-23T10:00:00.000Z",
  },
];
