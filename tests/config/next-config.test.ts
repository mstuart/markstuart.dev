import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("Next configuration", () => {
  it("limits Spotify image optimization to the album and artist image path", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(nextConfig.images?.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/image/**",
        search: "",
      },
    ]);
  });

  it("applies the functional static-rendering browser policy without overriding cache control", async () => {
    const rules = await nextConfig.headers?.();
    const sharedRule = rules?.find((rule) => rule.source === "/:path*");
    const headers = Object.fromEntries(
      sharedRule?.headers.map(({ key, value }) => [key, value]) ?? [],
    );

    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "X-Frame-Options": "DENY",
    });
    const contentSecurityPolicy = headers["Content-Security-Policy"];
    const scriptSource = contentSecurityPolicy
      ?.split("; ")
      .find((directive) => directive.startsWith("script-src "));
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(scriptSource).toBe("script-src 'self' 'unsafe-inline'");
    expect(contentSecurityPolicy).toContain("img-src 'self' data: blob: https://i.scdn.co");
    expect(contentSecurityPolicy).toContain("connect-src 'self'; object-src 'none'");
    expect(contentSecurityPolicy).not.toContain("accounts.spotify.com");
    expect(contentSecurityPolicy).not.toContain("api.spotify.com");
    expect(contentSecurityPolicy).not.toContain("api.resend.com");
    expect(headers).not.toHaveProperty("Cache-Control");
  });

  it("keeps API responses out of search indexes", async () => {
    const rules = await nextConfig.headers?.();
    const apiRule = rules?.find((rule) => rule.source === "/api/:path*");

    expect(apiRule?.headers ?? []).toContainEqual({
      key: "X-Robots-Tag",
      value: "noindex, nofollow",
    });
  });

  it("permanently redirects the previous jQuery article URL", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual({
      source: "/posts/jquery-universal-browser-api/:path*",
      destination: "/posts/jquery-compatibility-layer-shaped-web/:path*",
      permanent: true,
    });
  });
});
