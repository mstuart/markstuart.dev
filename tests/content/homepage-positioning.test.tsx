import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "@/components/home-page";

vi.mock("@/components/px/avatar", () => ({ PixelAvatar: () => null }));
vi.mock("@/components/px/scene5", () => ({ PixelScene5: () => null }));

describe("homepage positioning", () => {
  it("shows the five latest posts and keeps a path to all writing", () => {
    render(<HomePage />);

    const latestWriting = screen.getByRole("heading", { name: "Latest writing" }).parentElement;
    expect(latestWriting).not.toBeNull();
    if (!latestWriting) return;

    const postLinks = within(latestWriting)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href) => href !== "/posts");

    expect(postLinks).toEqual([
      "/posts/coding-agent-infrastructure",
      "/posts/hello-world",
      "https://careers.rocket.com/blog/technology-and-product/ai-authored-static-analysis-code-enforcement",
      "https://medium.com/paypal-tech/scaling-graphql-at-paypal-b5b5ac098810",
      "https://medium.com/paypal-tech/graphql-instrumenting-your-api-and-unlocking-superpowers-c0bc3a9dc451",
    ]);
    expect(within(latestWriting).getByRole("link", { name: "All writing" })).toHaveAttribute("href", "/posts");
  });
});
