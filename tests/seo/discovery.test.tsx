import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

async function loadModule<T>(id: string): Promise<T | null> {
  try {
    return await vi.importActual<T>(id);
  } catch {
    return null;
  }
}

describe("crawler discovery", () => {
  it("keeps the alternate TUI out of the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).not.toContain("https://markstuart.dev/tui");
    expect(urls).toContain("https://markstuart.dev/work/full");
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://markstuart.dev/projects/peek",
        "https://markstuart.dev/projects/tare",
        "https://markstuart.dev/projects/graphql-agent-toolkit",
      ])
    );
  });

  it("prevents crawlers from indexing API routes", () => {
    const value = robots();

    expect(value.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    });
  });
});

describe("discoverability assets", () => {
  it("publishes a 180px PNG Apple touch icon", async () => {
    const icon = await loadModule<{
      size?: { width: number; height: number };
      contentType?: string;
    }>("@/app/apple-icon");

    expect(icon).not.toBeNull();
    expect(icon?.size).toEqual({ width: 180, height: 180 });
    expect(icon?.contentType).toBe("image/png");
  });

  it("server-renders the complete long resume without an interaction", async () => {
    const route = await loadModule<{ default: () => React.ReactNode }>(
      "@/app/(site)/work/full/page"
    );

    expect(route).not.toBeNull();
    if (!route) return;

    const Page = route.default;
    render(<Page />);

    expect(
      screen.getByText(/Leads AI-enabled engineering initiatives/)
    ).toBeInTheDocument();
    expect(screen.getByText("Industry contributions")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
