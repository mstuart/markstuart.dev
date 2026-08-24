import { afterEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "@/lib/tui-commands";

describe("terminal listening privacy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("explains that live status is private without calling Spotify", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(runCommand("nowplaying")).resolves.toEqual({
      lines: [
        "Live listening status is private.",
        "'open listening' for recent history grouped by week.",
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
