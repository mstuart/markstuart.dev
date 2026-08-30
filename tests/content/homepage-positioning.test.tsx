import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "@/components/home-page";

vi.mock("@/components/px/avatar", () => ({ PixelAvatar: () => null }));
vi.mock("@/components/px/scene5", () => ({ PixelScene5: () => null }));

describe("homepage positioning", () => {
  it("shows the five latest posts with the same row details as the writing page", () => {
    render(<HomePage />);

    const latestWriting = screen.getByRole("heading", { name: "Latest writing" }).parentElement;
    expect(latestWriting).not.toBeNull();
    if (!latestWriting) return;

    const postLinks = within(latestWriting)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href) => href !== "/posts");

    expect(postLinks).toEqual([
      "/posts/bret-victor-feedback-loop",
      "/posts/stripe-developer-experience-reset-the-standard",
      "/posts/eslint-making-javascript-rules-programmable",
      "/posts/jquery-compatibility-layer-shaped-web",
      "https://careers.rocket.com/blog/technology-and-product/ai-authored-static-analysis-code-enforcement",
    ]);

    const writingLinks = within(latestWriting).getAllByRole("link").filter((link) => link.getAttribute("href") !== "/posts");
    for (const [link, logo] of writingLinks.map((link, index) => [
      link,
      ["/icon.svg", "/icon.svg", "/icon.svg", "/icon.svg", "/work/rocket.png"][index],
    ] as const)) {
      expect(decodeURIComponent(link.querySelector("img")?.getAttribute("src") ?? "")).toContain(logo);
    }

    expect(within(latestWriting).getAllByText("Aug 30, 2026")).toHaveLength(2);
    for (const date of ["Aug 28, 2026", "Aug 27, 2026", "May 19, 2026"]) {
      expect(within(latestWriting).getByText(date)).toBeVisible();
    }
    expect(within(latestWriting).queryByText("Hello, world")).not.toBeInTheDocument();
    expect(within(latestWriting).getByRole("link", { name: "All writing" })).toHaveAttribute("href", "/posts");
  });
});
