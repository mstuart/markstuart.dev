import { describe, expect, it, vi } from "vitest";

const fontLoaders = vi.hoisted(() => ({
  geist: vi.fn(() => ({ variable: "geist-sans" })),
  geistMono: vi.fn(() => ({ variable: "geist-mono" })),
  newsreader: vi.fn(() => ({ variable: "newsreader" })),
}));

vi.mock("next/font/google", () => ({
  Geist: fontLoaders.geist,
  Geist_Mono: fontLoaders.geistMono,
  Newsreader: fontLoaders.newsreader,
}));

vi.mock("@/components/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => children,
}));

describe("root font loading", () => {
  it("does not preload the specialty fonts on every route", async () => {
    await import("@/app/layout");

    expect(fontLoaders.geistMono).toHaveBeenCalledWith(
      expect.objectContaining({ preload: false }),
    );
    expect(fontLoaders.newsreader).toHaveBeenCalledWith(
      expect.objectContaining({ preload: false }),
    );
  });
});
