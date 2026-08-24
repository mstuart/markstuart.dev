import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchWithTimeout } from "@/lib/server/http";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchWithTimeout", () => {
  it("preserves a signal carried by a Request", async () => {
    const controller = new AbortController();
    const request = new Request("https://example.test", { signal: controller.signal });
    const observed: { signal?: AbortSignal } = {};
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        observed.signal = init?.signal ?? undefined;
        return Promise.resolve(new Response());
      }),
    );

    await fetchWithTimeout(request, {}, 1000);
    controller.abort();

    expect(observed.signal?.aborted).toBe(true);
  });

  it("preserves an init signal that is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const observed: { signal?: AbortSignal } = {};
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        observed.signal = init?.signal ?? undefined;
        return Promise.resolve(new Response());
      }),
    );

    await fetchWithTimeout("https://example.test", { signal: controller.signal }, 1000);

    expect(observed.signal?.aborted).toBe(true);
  });

  it("clears its timeout after fetch settles", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()));

    await fetchWithTimeout("https://example.test", {}, 1000);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
