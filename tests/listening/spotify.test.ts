import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheState = vi.hoisted(() => ({
  definitions: [] as Array<{
    keyParts?: string[];
    options?: { revalidate?: number; tags?: string[] };
  }>,
}));

vi.mock("next/cache", () => ({
  unstable_cache: (
    callback: (...args: unknown[]) => Promise<unknown>,
    keyParts?: string[],
    options?: { revalidate?: number; tags?: string[] }
  ) => {
    cacheState.definitions.push({ keyParts, options });
    const values = new Map<string, Promise<unknown>>();
    return (...args: unknown[]) => {
      const key = JSON.stringify(args);
      const existing = values.get(key);
      if (existing) return existing;
      const value = callback(...args);
      values.set(key, value);
      return value;
    };
  },
}));

function configureSpotify() {
  vi.stubEnv("SPOTIFY_CLIENT_ID", "client-id");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "client-secret");
  vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "refresh-token");
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("Spotify provider", () => {
  beforeEach(() => {
    configureSpotify();
    cacheState.definitions.length = 0;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("selects the smallest artwork that satisfies the requested width", async () => {
    const spotify = await import("@/lib/spotify");
    const selectImage = Reflect.get(spotify, "selectImage") as
      | ((images: Array<{ url: string; width: number }>, width: number) => { url: string })
      | undefined;

    expect(selectImage).toEqual(expect.any(Function));
    expect(
      selectImage?.(
        [
          { url: "large", width: 640 },
          { url: "medium", width: 300 },
          { url: "small", width: 64 },
        ],
        56
      )?.url
    ).toBe("small");
  });

  it("shares one in-flight access-token refresh across concurrent requests", async () => {
    const tokenResolvers: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("accounts.spotify.com")) {
        return new Promise<Response>((resolve) => tokenResolvers.push(resolve));
      }
      if (url.includes("currently-playing")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(json({ items: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const spotify = await import("@/lib/spotify");

    const requests = Promise.all([spotify.getNowPlaying(), spotify.getRecentlyPlayed()]);
    await Promise.resolve();
    for (const resolve of tokenResolvers) {
      resolve(json({ access_token: "token", expires_in: 3600 }));
    }
    await requests;

    expect(tokenResolvers).toHaveLength(1);
  });

  it("uses a shared three-hour cache for complete top-track results", async () => {
    let topTrackRequests = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("accounts.spotify.com")) {
          return Promise.resolve(json({ access_token: "token", expires_in: 3600 }));
        }
        topTrackRequests += 1;
        return Promise.resolve(
          json({
            items: [
              {
                name: "Song",
                artists: [{ name: "Artist" }],
                album: {
                  name: "Album",
                  images: [
                    { url: "https://i.scdn.co/image/large", width: 640 },
                    { url: "https://i.scdn.co/image/small", width: 64 },
                  ],
                },
              },
            ],
          })
        );
      })
    );
    const spotify = await import("@/lib/spotify");

    const first = await spotify.getTopTracks(10);
    const second = await spotify.getTopTracks(10);

    expect(second).toEqual(first);
    expect(topTrackRequests).toBe(1);
    expect(cacheState.definitions).toContainEqual({
      keyParts: ["spotify-top-tracks"],
      options: { revalidate: 10_800 },
    });
    expect(first[0]?.image).toBe("https://i.scdn.co/image/small");
  });

  it("applies abortable deadlines to token and provider fetches", async () => {
    const signals: Array<AbortSignal | null | undefined> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        signals.push(init?.signal);
        if (String(input).includes("accounts.spotify.com")) {
          return Promise.resolve(json({ access_token: "token", expires_in: 3600 }));
        }
        return Promise.resolve(new Response(null, { status: 204 }));
      })
    );
    const spotify = await import("@/lib/spotify");

    await spotify.getNowPlaying();

    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal instanceof AbortSignal)).toBe(true);
  });

  it("throws a generic unavailable error instead of returning an empty success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).includes("accounts.spotify.com")
            ? json({ access_token: "token", expires_in: 3600 })
            : json({ provider_detail: "do not expose" }, { status: 503 })
        )
      )
    );
    const spotify = await import("@/lib/spotify");

    await expect(spotify.getRecentlyPlayed()).rejects.toThrow("Spotify is unavailable");
  });

  it("rejects a malformed successful token response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).includes("accounts.spotify.com")
            ? json({ access_token: "", expires_in: 3600 })
            : json({ items: [] })
        )
      )
    );
    const spotify = await import("@/lib/spotify");

    await expect(spotify.getRecentlyPlayed()).rejects.toThrow("Spotify is unavailable");
  });

  it("rejects a malformed successful now-playing response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).includes("accounts.spotify.com")
            ? json({ access_token: "token", expires_in: 3600 })
            : json({
                is_playing: true,
                item: { name: "", artists: [], album: { name: "", images: [] } },
              })
        )
      )
    );
    const spotify = await import("@/lib/spotify");

    await expect(spotify.getNowPlaying()).rejects.toThrow("Spotify is unavailable");
  });

  it("rejects recent-history records with an invalid played-at timestamp", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).includes("accounts.spotify.com")
            ? json({ access_token: "token", expires_in: 3600 })
            : json({
                items: [
                  {
                    track: validRawTrack(),
                    played_at: "not-an-iso-timestamp",
                  },
                ],
              })
        )
      )
    );
    const spotify = await import("@/lib/spotify");

    await expect(spotify.getRecentlyPlayed()).rejects.toThrow("Spotify is unavailable");
  });

  it("rejects malformed complete top-track results before caching", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).includes("accounts.spotify.com")
            ? json({ access_token: "token", expires_in: 3600 })
            : json({ items: [{ name: "Song" }] })
        )
      )
    );
    const spotify = await import("@/lib/spotify");

    await expect(spotify.getTopTracks()).rejects.toThrow("Spotify is unavailable");
  });

  it("rejects malformed complete top-artist results before caching", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).includes("accounts.spotify.com")
            ? json({ access_token: "token", expires_in: 3600 })
            : json({ items: [{ name: "", genres: [] }] })
        )
      )
    );
    const spotify = await import("@/lib/spotify");

    await expect(spotify.getTopArtists()).rejects.toThrow("Spotify is unavailable");
  });

  it("discards invalid optional artwork instead of caching its URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).includes("accounts.spotify.com")
            ? json({ access_token: "token", expires_in: 3600 })
            : json({
                items: [
                  validRawTrack({
                    album: {
                      name: "Album",
                      images: [{ url: "not-a-url", width: -1 }],
                    },
                  }),
                ],
              })
        )
      )
    );
    const spotify = await import("@/lib/spotify");

    await expect(spotify.getTopTracks()).resolves.toEqual([
      {
        name: "Song",
        artist: "Artist",
        album: "Album",
        image: undefined,
        url: "https://open.spotify.com/track/song",
      },
    ]);
  });
});

function validRawTrack(overrides: Record<string, unknown> = {}) {
  return {
    name: "Song",
    artists: [{ name: "Artist" }],
    album: { name: "Album", images: [] },
    external_urls: { spotify: "https://open.spotify.com/track/song" },
    ...overrides,
  };
}
