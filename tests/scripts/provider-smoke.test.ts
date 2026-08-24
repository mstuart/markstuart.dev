import { describe, expect, it, vi } from "vitest";
import { runProviderSmoke } from "../../scripts/provider-smoke.mjs";

const productionBase = "https://markstuart.dev";

function expectedResponse(path: string): Response {
  if (path === "/api/listening?cursor=60") {
    return Response.json({ status: "ok", data: { items: [], nextCursor: null } });
  }
  if (path === "/api/votes?slug=hello-world") {
    return Response.json({ count: 0, voted: false }, { headers: { "Set-Cookie": "private-sentinel" } });
  }
  if (path.startsWith("/api/unsubscribe?token=")) {
    return new Response("<h1>Invalid link</h1>", { status: 400 });
  }
  if (path === "/api/spotify/now-playing") {
    return Response.json({ status: "unavailable", reason: "not_available" }, { status: 410 });
  }
  if (path === "/api/spotify/sync" || path === "/api/notify") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (path === "/api/subscribe" || path === "/api/email/inbound") {
    return new Response(null, { status: 405 });
  }
  throw new Error(`Unexpected test path: ${path}`);
}

describe("provider smoke", () => {
  it("uses only unauthenticated GET requests and reports status-only results", async () => {
    const calls: Array<{ url: URL; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input.toString());
      calls.push({ url, init });
      return expectedResponse(`${url.pathname}${url.search}`);
    });

    const results = await runProviderSmoke({ baseUrl: productionBase, fetchImpl });

    expect(results).toHaveLength(8);
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.map((result) => result.status)).toEqual([200, 200, 400, 410, 401, 401, 405, 405]);
    expect(calls.every(({ init }) => init?.method === "GET")).toBe(true);
    expect(calls.every(({ init }) => !init?.headers || !new Headers(init.headers).has("authorization"))).toBe(true);
    expect(JSON.stringify(results)).not.toContain("private-sentinel");
  });

  it("rejects base URLs containing credentials", async () => {
    await expect(
      runProviderSmoke({
        baseUrl: "https://user:private-sentinel@markstuart.dev",
        fetchImpl: vi.fn(),
      }),
    ).rejects.toThrow("must not contain credentials");
  });

  it("does not include a provider response body in failure output", async () => {
    const fetchImpl = vi.fn(async () => new Response("private-sentinel", { status: 500 }));

    const results = await runProviderSmoke({ baseUrl: productionBase, fetchImpl });

    expect(results[0]).toMatchObject({ ok: false, expectedStatus: 200, status: 500 });
    expect(JSON.stringify(results)).not.toContain("private-sentinel");
  });
});
