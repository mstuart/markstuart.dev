import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NowPlayingCard, RecentlyPlayed } from "@/components/listening-feed";

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
}

describe("listening feed", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setHidden(false);
  });

  it("polls once per minute only while visible and refreshes immediately on return", async () => {
    vi.useFakeTimers();
    setHidden(true);
    const fetchMock = vi.fn().mockResolvedValue(json({ status: "ok", data: null }));
    vi.stubGlobal("fetch", fetchMock);
    render(<NowPlayingCard />);

    await act(async () => Promise.resolve());
    expect(fetchMock).not.toHaveBeenCalled();

    setHidden(false);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(60_000));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    setHidden(true);
    document.dispatchEvent(new Event("visibilitychange"));
    await act(async () => vi.advanceTimersByTimeAsync(120_000));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    setHidden(false);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("aborts and ignores an older poll across a visibility refresh", async () => {
    setHidden(false);
    const first = deferred<Response>();
    const second = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<NowPlayingCard />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    setHidden(true);
    document.dispatchEvent(new Event("visibilitychange"));
    setHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      second.resolve(json(nowPlayingResult("New song")));
      await second.promise;
    });
    expect(await screen.findByText("New song")).toBeVisible();

    await act(async () => {
      first.resolve(json(nowPlayingResult("Old song")));
      await first.promise;
    });
    expect(screen.getByText("New song")).toBeVisible();
    expect(screen.queryByText("Old song")).not.toBeInTheDocument();

    const firstInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(firstInit?.signal).toBeInstanceOf(AbortSignal);
    expect(firstInit?.signal?.aborted).toBe(true);
  });

  it("uses sized Next images and keeps the equalizer static", async () => {
    setHidden(false);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({
          status: "ok",
          data: {
            name: "Live song",
            artist: "Artist",
            album: "Album",
            image: "https://i.scdn.co/image/example",
            url: "https://open.spotify.com/track/example",
            isPlaying: true,
          },
        })
      )
    );
    const { container } = render(<NowPlayingCard />);

    await screen.findByText("Live song");
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("width", "64");
    expect(image).toHaveAttribute("height", "64");
    expect(image).toHaveAttribute("sizes", "64px");
    expect(container.querySelector("[data-equalizer]")?.className).not.toContain("animate");
  });

  it("renders explicit history unavailability instead of an empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "unavailable", reason: "spotify_unavailable" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    render(<RecentlyPlayed />);

    expect(await screen.findByText("Listening history is temporarily unavailable.")).toBeVisible();
  });

  it("uses a lazy 32px image for stored history artwork", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({
          status: "ok",
          data: {
            items: [
              {
                name: "Past song",
                artist: "Artist",
                album: "Album",
                image: "https://i.scdn.co/image/past",
                url: "https://open.spotify.com/track/past",
                playedAt: new Date().toISOString(),
              },
            ],
            nextBefore: null,
          },
        })
      )
    );
    const { container } = render(<RecentlyPlayed />);

    await screen.findByText("Past song");
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("width", "32");
    expect(image).toHaveAttribute("height", "32");
    expect(image).toHaveAttribute("sizes", "32px");
    expect(image).toHaveAttribute("loading", "lazy");
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function nowPlayingResult(name: string) {
  return {
    status: "ok",
    data: {
      name,
      artist: "Artist",
      album: "Album",
      url: `https://open.spotify.com/track/${name}`,
      isPlaying: true,
    },
  };
}
