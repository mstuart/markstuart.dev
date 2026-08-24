import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectsPage from "@/app/(site)/projects/page";

describe("Projects listing links", () => {
  it("routes featured case-study cards internally and keeps separate repository links", () => {
    render(<ProjectsPage />);

    const caseStudies = ["peek", "tare", "graphql-agent-toolkit"];

    for (const name of caseStudies) {
      const card = screen.getByRole("heading", { level: 3, name }).closest("article");

      expect(card).not.toBeNull();
      const primaryLink = within(card as HTMLElement).getByRole("link", { name });
      const repositoryLink = within(card as HTMLElement).getByRole("link", {
        name: `${name} repository on GitHub`,
      });

      expect(primaryLink).toHaveAttribute(
        "href",
        `/projects/${name}`,
      );
      expect(repositoryLink).toHaveAttribute("href", `https://github.com/mstuart/${name}`);
      expect(repositoryLink).toHaveAttribute("target", "_blank");
      expect(repositoryLink).toHaveAttribute("rel", "noopener noreferrer");
      expect(primaryLink).not.toContainElement(repositoryLink);
    }
  });

  it("keeps the other featured projects linked directly to their repositories", () => {
    render(<ProjectsPage />);

    for (const name of ["vitals", "ai-statusline", "mcp-prune"]) {
      const card = screen.getByRole("heading", { level: 3, name }).closest("article");

      expect(card).not.toBeNull();
      expect(within(card as HTMLElement).getAllByRole("link")).toHaveLength(1);
      expect(within(card as HTMLElement).getByRole("link")).toHaveAttribute(
        "href",
        `https://github.com/mstuart/${name}`,
      );
    }
  });
});
