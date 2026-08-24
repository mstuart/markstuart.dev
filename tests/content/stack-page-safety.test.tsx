import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StackPage, { metadata } from "@/app/(site)/stack/page";

describe("public Stack page content safety", () => {
  it("places a clear commission disclosure before the hardware recommendations", () => {
    const { container } = render(<StackPage />);
    const publicPage = `${container.textContent} ${JSON.stringify(metadata)}`;
    const disclosure = screen.getByText(
      /Some hardware links are paid links, which means I may earn a commission\. As an Amazon Associate I earn from qualifying purchases\./i,
    );
    const firstRecommendation = screen.getByRole("link", { name: /MacBook Pro 14/i });

    expect(screen.getByRole("heading", { name: "Stack" })).toBeInTheDocument();
    expect(publicPage).toMatch(/hardware, apps, and tools I (?:use|reach for) every day/i);
    expect(disclosure.compareDocumentPosition(firstRecommendation)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(publicPage).not.toMatch(/149 repos/i);
  });
});
