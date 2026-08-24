import { render, screen } from "@testing-library/react";
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
      screen.getByText(/I've spent nearly two decades in software engineering/i),
    ).toBeVisible();
    expect(container.innerHTML).not.toMatch(
      /highest-scale|millions of people|thousands of engineers|Google Health|Fitbit|Pixel Watch|github\.com\/mstuart\/vitals|vitals:/i,
    );
    expect(screen.getByRole("link", { name: /Stack: a curated toolkit/i })).toBeInTheDocument();
  });
});
