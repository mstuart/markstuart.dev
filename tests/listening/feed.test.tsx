import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NowPlayingCard, RecentlyPlayed } from "@/components/listening-feed";

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

describe("listening feed", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not request or render live playback", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<NowPlayingCard />);
    await act(async () => Promise.resolve());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
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

  it("aborts the initial history request when the feed unmounts", async () => {
    const response = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValue(response.promise);
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<RecentlyPlayed />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.signal?.aborted).toBe(false);

    unmount();
    expect(init?.signal?.aborted).toBe(true);
  });

  it("aborts an in-flight load-more request when the feed unmounts", async () => {
    const nextPage = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          status: "ok",
          data: { items: [historyItem("First song")], nextCursor: 30 },
        })
      )
      .mockReturnValueOnce(nextPage.promise);
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<RecentlyPlayed />);
    fireEvent.click(await screen.findByRole("button", { name: "Load more" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/listening?cursor=30");
    const init = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.signal?.aborted).toBe(false);

    unmount();
    expect(init?.signal?.aborted).toBe(true);
  });

  it("keeps loaded items visible and offers a local retry after pagination fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          status: "ok",
          data: { items: [historyItem("First song")], nextCursor: 30 },
        })
      )
      .mockResolvedValueOnce(
        json({ status: "unavailable", reason: "history_unavailable" })
      )
      .mockResolvedValueOnce(
        json({
          status: "ok",
          data: { items: [historyItem("Second song")], nextCursor: null },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<RecentlyPlayed />);
    fireEvent.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Could not load more listening history.")).toBeVisible();
    expect(screen.getByText("First song")).toBeVisible();
    expect(screen.queryByText("Listening history is temporarily unavailable.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Second song")).toBeVisible();
    expect(screen.getByText("First song")).toBeVisible();
    expect(screen.queryByText("Could not load more listening history.")).not.toBeInTheDocument();
  });

  it("uses lazy artwork and labels history by week instead of exact play time", async () => {
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
                playedDuring: "2026-08-17",
              },
            ],
            nextCursor: null,
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
    expect(screen.getByText("Week of Aug 17")).toBeVisible();
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function historyItem(name: string) {
  return {
    name,
    artist: "Artist",
    album: "Album",
    playedDuring: "2026-08-17",
  };
}
