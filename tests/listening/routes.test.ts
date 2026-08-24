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

  it("retires public now-playing without reading from Spotify", async () => {
    const { GET } = await import("@/app/api/spotify/now-playing/route");

    const response = await GET();

    expect(response.status).toBe(410);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      status: "unavailable",
      reason: "not_available",
    });
    expect(spotifyMock.getNowPlaying).not.toHaveBeenCalled();
  });

  it("serves coarsened history through a short shared cache", async () => {
    const page = { items: plays, nextCursor: null };
    storeMock.getHistory.mockResolvedValue(page);
    const { GET } = await import("@/app/api/listening/route");

    const response = await GET(new Request("https://example.test/api/listening"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, s-maxage=300, stale-while-revalidate=600"
    );
    await expect(response.json()).resolves.toEqual({ status: "ok", data: page });
    expect(storeMock.getHistory).toHaveBeenCalledWith(0, 30);
  });

  it("uses the shared safe error envelope for an invalid cursor", async () => {
    const { GET } = await import("@/app/api/listening/route");

    const response = await GET(new Request("https://example.test/api/listening?cursor=nope"));
    const body = (await response.json()) as {
      error: { code: string; correlationId: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_cursor");
    expect(body.error.correlationId).toEqual(expect.any(String));
  });

  it("rejects cursors outside the 90-item public history window", async () => {
    const { GET } = await import("@/app/api/listening/route");

    const response = await GET(new Request("https://example.test/api/listening?cursor=90"));

    expect(response.status).toBe(400);
    expect(storeMock.getHistory).not.toHaveBeenCalled();
  });

  it("rejects cursors that bypass the fixed public page boundaries", async () => {
    const { GET } = await import("@/app/api/listening/route");

    const response = await GET(new Request("https://example.test/api/listening?cursor=1"));

    expect(response.status).toBe(400);
    expect(storeMock.getHistory).not.toHaveBeenCalled();
  });

  it("does not read Spotify for a fallback cursor beyond its 50-play window", async () => {
    storeMock.isHistoryConfigured.mockReturnValue(false);
    const { GET } = await import("@/app/api/listening/route");

    const response = await GET(new Request("https://example.test/api/listening?cursor=60"));

    expect(response.status).toBe(400);
    expect(storeMock.getHistory).not.toHaveBeenCalled();
  });

  it.each([
    "?source=widget",
    "?cursor=30&cursor=60",
    "?cursor=",
    "?cursor=0",
    "?cursor=030",
  ])("rejects noncanonical query string %s before reading history", async (query) => {
    const { GET } = await import("@/app/api/listening/route");

    const response = await GET(new Request(`https://example.test/api/listening${query}`));

    expect(response.status).toBe(400);
    expect(storeMock.getHistory).not.toHaveBeenCalled();
  });
});

const plays = [
  {
    name: "Song",
    artist: "Artist",
    album: "Album",
    playedDuring: "2026-08-17",
  },
];
