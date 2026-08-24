import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PressPage from "@/app/(site)/press/page";
import ProjectsPage from "@/app/(site)/projects/page";
import { AllReposFilter } from "@/components/all-repos-filter";
import { SectionV1 } from "@/components/v1/section";
import { SiteFooter } from "@/components/shared/site-footer";
import { SocialLinks } from "@/components/shared/social-links";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { allRepos, type RepoIndexEntry } from "@/lib/data/all-projects";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

vi.mock("next/font/google", () => ({
  Mrs_Saint_Delafield: () => ({ className: "font-script" }),
}));

describe("Projects design contracts", () => {
  it("uses the full repository array for both the section count and filter count", () => {
    render(<ProjectsPage />);

    const repositoryHeading = screen.getByRole("heading", { name: /all repositories/i });
    expect(repositoryHeading).toHaveTextContent(String(allRepos.length));
    expect(screen.getByRole("button", { name: `All ${allRepos.length}` })).toBeInTheDocument();
  });

  it("uses a wider two-column surface without truncating project names or descriptions", () => {
    render(<ProjectsPage />);

    const page = screen.getByRole("heading", { level: 1, name: "Projects" }).parentElement;
    const featured = screen.getByRole("heading", { level: 2, name: "Featured" }).nextElementSibling;
    const longTitle = screen.getByText("paypal-checkout-components");
    const longDescription = screen.getByText(/UI components powering the PayPal Checkout integration/i);

    expect(page).toHaveClass("max-w-5xl");
    expect(featured).toHaveClass("md:grid-cols-2");
    expect(longTitle).not.toHaveClass("truncate");
    expect(longDescription).not.toHaveClass("line-clamp-2");
  });

  it("exposes each project card title as a level-three heading", () => {
    render(<ProjectsPage />);

    expect(
      screen.getByRole("heading", { level: 3, name: "paypal-checkout-components" }),
    ).toBeInTheDocument();
  });

  it("shows pressed state without relying on color and announces singular or plural results", async () => {
    const user = userEvent.setup();
    const repos: RepoIndexEntry[] = [
      { name: "agent-one", stars: 0, tag: "AI & Agents" },
      { name: "agent-two", stars: 0, tag: "AI & Agents" },
      { name: "graph-one", stars: 0, tag: "GraphQL" },
    ];
    render(<AllReposFilter repos={repos} />);

    const all = screen.getByRole("button", { name: "All 3" });
    const graph = screen.getByRole("button", { name: "GraphQL 1" });
    const agents = screen.getByRole("button", { name: "AI & Agents 2" });

    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(within(all).getByText("✓")).toBeVisible();

    await user.click(graph);

    expect(graph).toHaveAttribute("aria-pressed", "true");
    expect(within(graph).getByText("✓")).toBeVisible();
    expect(within(all).queryByText("✓")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 result");

    await user.click(agents);

    expect(screen.getByRole("status")).toHaveTextContent("2 results");
  });
});

describe("Press design contracts", () => {
  it("orders evidence by impact and separates in-progress manuscripts from published books", () => {
    render(<PressPage />);

    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(headings.filter((heading) => heading !== "Manuscripts")).toEqual([
      "Quotes",
      "Books",
      "Teaching",
      "Newsletters",
      "Community",
    ]);
    expect(headings).toContain("Manuscripts");

    const books = screen.getByRole("heading", { level: 2, name: "Books" }).parentElement;
    const manuscripts = screen.getByRole("heading", { level: 2, name: "Manuscripts" }).parentElement;
    expect(within(books as HTMLElement).getByText(/Production Ready GraphQL/i)).toBeInTheDocument();
    expect(within(books as HTMLElement).queryByText(/Federated GraphQL on \.NET/i)).not.toBeInTheDocument();
    expect(within(manuscripts as HTMLElement).getByText(/Federated GraphQL on \.NET/i)).toBeInTheDocument();
  });

  it("renders local mention artwork through the Next image component", () => {
    const { container } = render(<PressPage />);

    expect(container.querySelector("img")).toHaveAttribute("data-nimg", "1");
  });
});

describe("shared visual recipes", () => {
  it("uses the semantic muted-text recipe for section labels", () => {
    render(<SectionV1 heading="Work" index={1}>Content</SectionV1>);

    expect(screen.getByRole("heading", { name: "Work" })).toHaveClass("text-muted");
  });

  it("gives utility controls and social links 44px targets", () => {
    render(
      <>
        <ThemeToggle />
        <SocialLinks />
      </>,
    );

    expect(screen.getByRole("button", { name: /switch to dark theme/i })).toHaveClass("h-11", "w-11");
    for (const name of ["GitHub", "LinkedIn", "X"]) {
      expect(screen.getByRole("link", { name })).toHaveClass("h-11", "w-11");
    }
  });

  it("uses the existing mono voice for the footer sign-off instead of display script", () => {
    render(<SiteFooter />);

    const signOff = screen.getByText(/^Mark Stuart$/);
    expect(signOff).toHaveClass("font-mono");
    expect(signOff).not.toHaveClass("text-5xl");
  });
});
