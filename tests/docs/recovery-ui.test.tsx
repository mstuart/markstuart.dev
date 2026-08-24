import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NotFound from "@/app/not-found";
import SiteError from "@/app/(site)/error";
import Loading from "@/app/(site)/loading";

vi.mock("@/components/px/monogram2", () => ({
  PixelMonogram2: () => <span data-testid="pixel-monogram">MS</span>,
}));

describe("route recovery UI", () => {
  it("offers Home as the single primary 404 action and a secondary Projects link", () => {
    render(<NotFound />);

    expect(screen.getByTestId("pixel-monogram")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
    const home = screen.getByRole("link", { name: "Home" });
    const projects = screen.getByRole("link", { name: "Projects" });
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveClass("bg-control", "text-control-foreground");
    expect(projects).toHaveAttribute("href", "/projects");
    expect(projects).not.toHaveClass("bg-control");
  });

  it("retries a failed route without exposing the thrown message", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<SiteError error={new Error("private provider failure")} retry={retry} />);

    expect(screen.queryByText("private provider failure")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("reserves a restrained loading skeleton without flashing animation", () => {
    const { container } = render(<Loading />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading page")).toHaveClass("sr-only");
    expect(container.querySelector('[class*="animate-"]')).toBeNull();
    expect(container.querySelectorAll("[data-skeleton]").length).toBeGreaterThan(2);
  });
});
