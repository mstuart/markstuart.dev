import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const spotifyMock = vi.hoisted(() => ({
  isSpotifyConfigured: vi.fn(),
  getTopArtists: vi.fn(),
  getTopTracks: vi.fn(),
}));
const logMock = vi.hoisted(() => ({ logServerError: vi.fn() }));
const connectionMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/spotify", () => spotifyMock);
vi.mock("@/lib/server/log", () => logMock);
vi.mock("next/server", () => ({ connection: connectionMock }));
vi.mock("@/components/listening-feed", () => ({
  NowPlayingCard: () => null,
  RecentlyPlayed: () => null,
}));

describe("listening page provider boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spotifyMock.isSpotifyConfigured.mockReturnValue(true);
  });

  it("keeps the explanatory shell visible when Spotify fails", async () => {
    spotifyMock.getTopArtists.mockRejectedValue(new Error("provider failed"));
    spotifyMock.getTopTracks.mockRejectedValue(new Error("provider failed"));
    const { default: ListeningPage } = await import("@/app/(site)/listening/page");

    const page = await ListeningPage().catch(() => null);
    expect(page).not.toBeNull();
    if (!page) return;
    render(page);

    expect(screen.getByText("Top artists, last year")).toBeVisible();
    expect(screen.getByText("Top songs, last year")).toBeVisible();
    expect(screen.getByText("Top genres, last year")).toBeVisible();
    expect(screen.getAllByText("Spotify data is temporarily unavailable.")).toHaveLength(3);
    expect(screen.getByText(/stored listening history is synced daily/i)).toBeVisible();
    expect(screen.getByText(/now playing updates live/i)).toBeVisible();
  });

  it("renders at request time so an unavailable shell is not cached as the route", async () => {
    spotifyMock.getTopArtists.mockResolvedValue([]);
    spotifyMock.getTopTracks.mockResolvedValue([]);
    const pageModule = await import("@/app/(site)/listening/page");

    expect(Reflect.get(pageModule, "revalidate")).toBeUndefined();
    await pageModule.default();
    expect(connectionMock).toHaveBeenCalledTimes(1);
  });
});
