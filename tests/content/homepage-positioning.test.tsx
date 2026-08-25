import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "@/components/home-page";

vi.mock("@/components/px/avatar", () => ({ PixelAvatar: () => null }));
vi.mock("@/components/px/scene5", () => ({ PixelScene5: () => null }));

describe("homepage positioning", () => {
  it("links the selected ideas locally and keeps a path to all writing", () => {
    render(<HomePage />);

    const selectedIdeas = screen.getByRole("heading", { name: "Selected ideas" }).parentElement;
    expect(selectedIdeas).not.toBeNull();
    if (!selectedIdeas) return;

    const localPostLinks = within(selectedIdeas)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href) => href?.startsWith("/posts/"));

    expect(localPostLinks).toEqual(["/posts/coding-agent-infrastructure"]);
    expect(within(selectedIdeas).getByRole("link", { name: "All writing" })).toHaveAttribute("href", "/posts");
  });
});
