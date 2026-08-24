import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UpvoteButton } from "@/components/upvote-button";

const storedValues = new Map<string, string>();

beforeEach(() => {
  storedValues.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storedValues.get(key) ?? null,
    setItem: (key: string, value: string) => storedValues.set(key, value),
    removeItem: (key: string) => storedValues.delete(key),
    clear: () => storedValues.clear(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UpvoteButton", () => {
  it("rolls back an optimistic vote when the server rejects it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ votes: 7, voted: false }))
      .mockResolvedValueOnce(Response.json({ error: { code: "vote_failed" } }, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<UpvoteButton slug="hello-world" />);

    await screen.findByText("7");
    await user.click(screen.getByRole("button", { name: /upvote/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /upvote/i })).toBeEnabled());
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(storedValues.get("voted:hello-world")).toBeUndefined();
  });

  it("ignores a late initial GET after a completed vote", async () => {
    let resolveInitialGet: ((response: Response) => void) | undefined;
    const initialGet = new Promise<Response>((resolve) => {
      resolveInitialGet = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(initialGet)
      .mockResolvedValueOnce(Response.json({ votes: 1, voted: true }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<UpvoteButton slug="hello-world" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: /upvote/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /upvoted/i })).toBeDisabled());

    resolveInitialGet?.(Response.json({ votes: 0, voted: false }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByRole("button", { name: /upvoted/i })).toBeDisabled();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("ignores a late vote response after the slug changes", async () => {
    let resolveVote: ((response: Response) => void) | undefined;
    const vote = new Promise<Response>((resolve) => {
      resolveVote = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ votes: 7, voted: false }))
      .mockReturnValueOnce(vote)
      .mockResolvedValueOnce(Response.json({ votes: 2, voted: false }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    const { rerender } = render(<UpvoteButton slug="hello-world" />);
    await screen.findByText("7");
    await user.click(screen.getByRole("button", { name: /upvote/i }));

    rerender(<UpvoteButton slug="new-post" />);
    await screen.findByText("2");
    resolveVote?.(Response.json({ votes: 8, voted: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByRole("button", { name: /upvote/i })).toBeEnabled();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("ignores a late vote failure after the slug changes", async () => {
    let rejectVote: ((error: Error) => void) | undefined;
    const vote = new Promise<Response>((_resolve, reject) => {
      rejectVote = reject;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ votes: 7, voted: false }))
      .mockReturnValueOnce(vote)
      .mockResolvedValueOnce(Response.json({ votes: 2, voted: false }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    const { rerender } = render(<UpvoteButton slug="hello-world" />);
    await screen.findByText("7");
    await user.click(screen.getByRole("button", { name: /upvote/i }));

    rerender(<UpvoteButton slug="new-post" />);
    await screen.findByText("2");
    rejectVote?.(new Error("late failure"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByRole("button", { name: /upvote/i })).toBeEnabled();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
