import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "@/components/home-page";

vi.mock("@/components/px/avatar", () => ({ PixelAvatar: () => null }));
vi.mock("@/components/px/scene5", () => ({ PixelScene5: () => null }));

describe("public homepage content safety", () => {
  it("keeps the existing profile sections without publishing health inventory or internal scale claims", () => {
    const { container } = render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Mark Stuart" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reach me" })).toBeInTheDocument();
    expect(
      screen.getByText(/For nearly two decades, I've built APIs, SDKs, and Web platforms/i),
    ).toBeVisible();
    expect(container.innerHTML).not.toMatch(
      /highest-scale|millions of people|thousands of engineers|Google Health|Fitbit|Pixel Watch|github\.com\/mstuart\/vitals|vitals:/i,
    );
    expect(screen.getByRole("link", { name: /Stack: a curated toolkit/i })).toBeInTheDocument();
  });

  it("keeps the homepage name beside the portrait at mobile widths", () => {
    render(<HomePage />);

    const heading = screen.getByRole("heading", { name: "Mark Stuart" });
    const heroRow = heading.parentElement?.parentElement;

    expect(heroRow).toHaveClass("flex", "items-center", "gap-2", "min-[360px]:gap-4");
    expect(heroRow).not.toHaveClass("flex-col");
  });

  it("orders Elsewhere links by the requested profile priority", () => {
    render(<HomePage />);

    const elsewhere = screen.getByText(/Elsewhere:/).closest("p");
    expect(elsewhere).not.toBeNull();
    if (!elsewhere) return;

    expect(within(elsewhere).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Medium",
      "GitHub",
      "npm",
      "Speaker Deck",
    ]);
  });
});
