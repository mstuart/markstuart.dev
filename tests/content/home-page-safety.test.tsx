import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "@/components/home-page";

vi.mock("@/components/px/avatar", () => ({ PixelAvatar: () => null }));
vi.mock("@/components/px/scene5", () => ({ PixelScene5: () => null }));

describe("public homepage content safety", () => {
  it("shows each employer with its company logo", () => {
    render(<HomePage />);

    const employerLogos = [
      ["Rocket", "/work/rocket.png"],
      ["eBay", "/work/ebay.png"],
      ["PayPal", "/work/paypal.png"],
      ["State Farm", "/work/statefarm.png"],
    ] as const;

    for (const [name, src] of employerLogos) {
      const image = screen.getByRole("link", { name }).querySelector("img");
      expect(image).not.toBeNull();
      expect(decodeURIComponent(image?.getAttribute("src") ?? "")).toContain(src);
    }
  });

  it("shows all five featured projects under Building without a contributor row", () => {
    render(<HomePage />);

    const building = screen.getByText("Building").closest("p");
    expect(building).not.toBeNull();
    if (!building) return;

    expect(within(building).getAllByRole("link")).toHaveLength(5);
    for (const name of ["peek", "tare", "mcp-prune", "ai-statusline", "graphql-agent-toolkit"]) {
      expect(within(building).getByRole("link", { name: new RegExp(`^${name}:`) })).toBeInTheDocument();
    }
    expect(screen.queryByText("Core contributor to")).not.toBeInTheDocument();
  });

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
    expect(
      screen.getByRole("link", { name: /Stack: the hardware, apps, and tools I use every day/i }),
    ).toBeInTheDocument();
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
