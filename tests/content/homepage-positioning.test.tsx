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
      "https://careers.rocket.com/blog/technology-and-product/ai-authored-static-analysis-code-enforcement",
      "https://medium.com/paypal-tech/scaling-graphql-at-paypal-b5b5ac098810",
      "https://medium.com/paypal-tech/graphql-instrumenting-your-api-and-unlocking-superpowers-c0bc3a9dc451",
      "https://medium.com/paypal-tech/graphql-resolvers-best-practices-cd36fdbcef55",
      "https://medium.com/paypal-tech/graphql-a-success-story-for-paypal-checkout-3482f724fb53",
    ]);

    const writingLinks = within(latestWriting).getAllByRole("link").filter((link) => link.getAttribute("href") !== "/posts");
    for (const [link, logo] of writingLinks.map((link, index) => [
      link,
      ["/work/rocket.png", "/work/paypal.png", "/work/paypal.png", "/work/paypal.png", "/work/paypal.png"][index],
    ] as const)) {
      expect(decodeURIComponent(link.querySelector("img")?.getAttribute("src") ?? "")).toContain(logo);
    }

    for (const date of ["May 19, 2026", "Oct 30, 2019", "Mar 13, 2019", "Dec 11, 2018", "Oct 16, 2018"]) {
      expect(within(latestWriting).getByText(date)).toBeVisible();
    }
    for (const views of ["34K views", "11.6K views", "269K views", "96K views"]) {
      expect(within(latestWriting).getByText(new RegExp(views))).toBeVisible();
    }
    expect(within(latestWriting).queryByText("Hello, world")).not.toBeInTheDocument();
    expect(within(latestWriting).getByRole("link", { name: "All writing" })).toHaveAttribute("href", "/posts");
  });
});
