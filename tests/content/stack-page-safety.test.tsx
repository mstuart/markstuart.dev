import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StackPage, { metadata } from "@/app/(site)/stack/page";

describe("public Stack page content safety", () => {
  it("presents a curated toolkit without purchase disclosures or live repository counts", () => {
    const { container } = render(<StackPage />);
    const publicPage = `${container.textContent} ${JSON.stringify(metadata)}`;

    expect(screen.getByRole("heading", { name: "Stack" })).toBeInTheDocument();
    expect(publicPage).toMatch(/curated toolkit/i);
    expect(publicPage).not.toMatch(
      /Amazon affiliate|Amazon Associate|qualifying purchases|149 repos|reach for every day|use every day/i,
    );
  });
});
