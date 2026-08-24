import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SiteLayout from "@/app/(site)/layout";
import { ActiveNavLink } from "@/components/shared/active-nav-link";
import { MobileNav } from "@/components/shared/mobile-nav";
import { SiteHeader } from "@/components/shared/site-header";
import { TuiTerminal } from "@/components/tui-terminal";

const navigation = vi.hoisted(() => ({
  pathname: "/talks",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
}));

vi.mock("@/components/px/monogram2", () => ({
  PixelMonogram2: () => <span aria-hidden="true" />,
}));

vi.mock("@/components/shared/social-links", () => ({
  SocialLinks: () => <a href="https://example.com">Social</a>,
}));

vi.mock("@/components/shared/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

vi.mock("@/components/shared/site-footer", () => ({
  SiteFooter: () => <footer>Footer</footer>,
}));

Element.prototype.scrollIntoView = vi.fn();

const mediaListeners = new Set<(event: MediaQueryListEvent) => void>();
let desktopMatches = false;

function setDesktopBreakpoint(matches: boolean) {
  desktopMatches = matches;
  for (const listener of mediaListeners) {
    listener({ matches, media: "(min-width: 768px)" } as MediaQueryListEvent);
  }
}

describe("site navigation accessibility", () => {
  beforeEach(() => {
    navigation.pathname = "/talks";
    desktopMatches = false;
    mediaListeners.clear();
    document.body.style.overflow = "";
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: desktopMatches,
        media: "(min-width: 768px)",
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.add(listener),
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.delete(listener),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("provides a skip link and a programmatically focusable main target", () => {
    render(<SiteLayout><p>Page content</p></SiteLayout>);

    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("marks the current desktop navigation link", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Talks" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Work" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the desktop navigation within a wide non-shrinking header shell", () => {
    render(<SiteHeader />);

    const nav = screen.getByRole("navigation");
    expect(nav.parentElement).toHaveClass("max-w-5xl");
    expect(nav).toHaveClass("shrink-0");
  });

  it("distinguishes an exact current page from its parent section", () => {
    navigation.pathname = "/posts/hello-world";
    const view = render(<ActiveNavLink href="/posts">Writing</ActiveNavLink>);

    expect(screen.getByRole("link", { name: "Writing" })).toHaveAttribute("aria-current", "location");

    navigation.pathname = "/posts";
    view.rerender(<ActiveNavLink href="/posts">Writing</ActiveNavLink>);
    expect(screen.getByRole("link", { name: "Writing" })).toHaveAttribute("aria-current", "page");
  });

  it("exposes a named modal and makes the page background inert", async () => {
    const user = userEvent.setup();
    render(
      <>
        <main><button type="button">Background</button></main>
        <MobileNav links={[{ href: "/work", label: "Work" }, { href: "/talks", label: "Talks" }]} />
        <footer>Footer</footer>
      </>,
    );

    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger).toHaveAttribute("aria-controls", "mobile-navigation-dialog");
    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: /site navigation/i })).toHaveAttribute("aria-modal", "true");
    expect(document.querySelector("main")).toHaveAttribute("inert");
    expect(document.querySelector("footer")).toHaveAttribute("inert");
    expect(screen.getByRole("link", { name: "Work" })).toHaveFocus();
  });

  it("traps focus in the mobile menu and restores it on Escape", async () => {
    const user = userEvent.setup();
    render(<MobileNav links={[{ href: "/work", label: "Work" }, { href: "/talks", label: "Talks" }]} />);

    const trigger = screen.getByRole("button", { name: /open menu/i });
    await user.click(trigger);
    const firstLink = screen.getByRole("link", { name: "Work" });
    const lastControl = screen.getByRole("button", { name: /close menu/i });

    lastControl.focus();
    await user.tab();
    expect(firstLink).toHaveFocus();
    await user.tab({ shift: true });
    expect(lastControl).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("closes and cleans up modal isolation at the desktop breakpoint", async () => {
    const user = userEvent.setup();
    render(
      <>
        <main>Page content</main>
        <MobileNav links={[{ href: "/work", label: "Work" }]} />
        <footer>Footer</footer>
      </>,
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(document.querySelector("main")).toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");

    setDesktopBreakpoint(true);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.querySelector("main")).not.toHaveAttribute("inert");
      expect(document.querySelector("footer")).not.toHaveAttribute("inert");
      expect(document.body.style.overflow).toBe("");
    });
  });

  it("does not reopen the menu when Back returns to its former pathname", async () => {
    const user = userEvent.setup();
    const links = [{ href: "/work", label: "Work" }];
    const view = render(<MobileNav links={links} />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    navigation.pathname = "/work";
    view.rerender(<MobileNav links={links} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    navigation.pathname = "/talks";
    view.rerender(<MobileNav links={links} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("isolates header controls and recaptures focus inside the modal", async () => {
    const user = userEvent.setup();
    render(
      <>
        <header><button type="button">Header action</button><MobileNav links={[{ href: "/work", label: "Work" }]} /></header>
        <main>Page content</main>
        <footer>Footer</footer>
      </>,
    );

    const headerAction = screen.getByRole("button", { name: "Header action" });
    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const firstLink = screen.getByRole("link", { name: "Work" });

    expect(headerAction.closest("[inert]")).not.toBeNull();
    headerAction.focus();
    expect(firstLink).toHaveFocus();
    expect(screen.getByRole("button", { name: /close menu/i })).toBeInTheDocument();
  });
});

describe("terminal accessibility", () => {
  it("allows Tab to leave the terminal input", async () => {
    const user = userEvent.setup();
    render(<TuiTerminal />);
    const input = screen.getByRole("textbox", { name: /terminal input/i });

    input.focus();
    await user.tab();

    expect(input).not.toHaveFocus();
  });

  it("provides a main heading and announces appended terminal output", () => {
    render(<TuiTerminal />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /terminal/i })).toBeInTheDocument();
    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("log")).toHaveAttribute("aria-relevant", "additions");
  });
});
