import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubscribeForm } from "@/components/subscribe-form";
import { TalksFilter, type TalkListRow } from "@/components/talks-filter";

const rows: TalkListRow[] = [
  { title: "First talk", date: "2026-01", tag: "Talks", iconSrc: "/talks/first.png" },
  { title: "Second talk", date: "2025-01", tag: "Talks" },
  { title: "Community event", date: "2024-01", tag: "Community" },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("subscription form accessibility", () => {
  it("connects a visible email label and help text to the email field", () => {
    render(<SubscribeForm />);

    const input = screen.getByRole("textbox", { name: "Email address" });
    expect(screen.getByText("Email address", { selector: "label" })).toBeVisible();
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAttribute("aria-describedby", "subscription-email-help");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(document.getElementById("subscription-email-help")).toBeInTheDocument();
  });

  it("announces a generic double-opt-in success without revealing address state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true, added: false }),
    }));
    const user = userEvent.setup();
    render(<SubscribeForm />);

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/check your email to confirm/i);
    expect(screen.queryByText(/already subscribed/i)).not.toBeInTheDocument();
  });

  it("announces errors and marks the email field invalid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(<SubscribeForm />);

    const input = screen.getByRole("textbox", { name: "Email address" });
    await user.type(input, "person@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("clears a stale error while the user edits a retry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(<SubscribeForm />);

    const input = screen.getByRole("textbox", { name: "Email address" });
    await user.type(input, "person@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.type(input, "x");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("clears a stale success status when a new address is entered", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true }),
    }));
    const user = userEvent.setup();
    render(<SubscribeForm />);

    const input = screen.getByRole("textbox", { name: "Email address" });
    await user.type(input, "person@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(await screen.findByRole("status")).toBeInTheDocument();

    await user.type(input, "next@example.com");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("talk filters accessibility", () => {
  it("announces the visible result count when a filter changes", async () => {
    const user = userEvent.setup();
    render(<TalksFilter rows={rows} />);

    expect(screen.getByRole("status")).toHaveTextContent("3 results");
    await user.click(screen.getByRole("button", { name: /community/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/^1 result$/);
  });
});
