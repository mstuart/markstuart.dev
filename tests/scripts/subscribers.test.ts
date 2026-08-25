import { describe, expect, it, vi } from "vitest";
import { runSubscriberCommand } from "../../scripts/subscribers.mjs";

describe("subscriber report", () => {
  it("prints only the active count by default", async () => {
    const write = vi.fn();

    const exitCode = await runSubscriberCommand({
      args: [],
      listSubscribers: vi.fn().mockResolvedValue(["reader@example.com", "another@example.com"]),
      write,
      writeError: vi.fn(),
    });

    expect(exitCode).toBe(0);
    expect(write).toHaveBeenCalledWith("Active subscribers: 2");
    expect(write.mock.calls.flat().join("\n")).not.toContain("@");
  });

  it("prints sorted addresses only with the explicit flag", async () => {
    const write = vi.fn();

    const exitCode = await runSubscriberCommand({
      args: ["--show-emails"],
      listSubscribers: vi.fn().mockResolvedValue(["reader@example.com", "another@example.com"]),
      write,
      writeError: vi.fn(),
    });

    expect(exitCode).toBe(0);
    expect(write).toHaveBeenCalledWith(
      "Active subscribers: 2\n\nanother@example.com\nreader@example.com",
    );
  });

  it("does not expose provider errors or subscriber data on failure", async () => {
    const write = vi.fn();
    const writeError = vi.fn();

    const exitCode = await runSubscriberCommand({
      args: [],
      listSubscribers: vi.fn().mockRejectedValue(new Error("private-token reader@example.com")),
      write,
      writeError,
    });

    expect(exitCode).toBe(1);
    expect(write).not.toHaveBeenCalled();
    expect(writeError).toHaveBeenCalledWith("Unable to load subscribers. Check Redis configuration.");
    expect(writeError.mock.calls.flat().join("\n")).not.toMatch(/private-token|reader@example\.com/);
  });
});
