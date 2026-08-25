import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
  Newsreader: () => ({ variable: "font-newsreader" }),
}));

vi.mock("@/components/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => <span data-vercel-analytics="enabled" />,
}));

import RootLayout from "@/app/layout";

describe("web analytics", () => {
  it("includes Vercel Web Analytics in the root layout", () => {
    const markup = renderToStaticMarkup(
      <RootLayout params={Promise.resolve({})}>
        <main>Page content</main>
      </RootLayout>
    );

    expect(markup).toContain('data-vercel-analytics="enabled"');
  });
});
